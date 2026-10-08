import re
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlmodel import Session, select, func, case

from .db import get_session
from .models import Game, Result, Mode

router = APIRouter(tags=["leaderboard"])

# Simple in-memory rate limit for POST /games: per client IP, sliding window.
# State lives in this process only, so it resets on restart and is per worker.
RATE_LIMIT_MAX = 10
RATE_LIMIT_WINDOW_SECONDS = 60.0
MAX_PGN_LENGTH = 20_000

_hits: dict[str, deque] = defaultdict(deque)
_hits_lock = threading.Lock()


def reset_rate_limit() -> None:
    with _hits_lock:
        _hits.clear()


def _client_ip(request: Request) -> str:
    # Behind a proxy (Render) the last X-Forwarded-For entry is the one the
    # proxy added, so a client cannot fake it by sending its own header.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(request: Request) -> None:
    ip = _client_ip(request)
    now = time.monotonic()
    with _hits_lock:
        hits = _hits[ip]
        while hits and now - hits[0] >= RATE_LIMIT_WINDOW_SECONDS:
            hits.popleft()
        if len(hits) >= RATE_LIMIT_MAX:
            retry = max(1, int(RATE_LIMIT_WINDOW_SECONDS - (now - hits[0])) + 1)
            raise HTTPException(
                status_code=429,
                detail="Too many games submitted, try again later",
                headers={"Retry-After": str(retry)},
            )
        hits.append(now)
        if len(_hits) > 10_000:  # drop idle IPs so the dict cannot grow forever
            for key in [k for k, v in _hits.items() if not v]:
                del _hits[key]


def normalize_name(raw: str) -> str:
    """Trim and collapse inner whitespace. Case is kept for display."""
    return re.sub(r"\s+", " ", raw).strip()


class GameCreate(BaseModel):
    player_name: str
    result: Result
    mode: Mode
    pgn: str | None = Field(default=None, max_length=MAX_PGN_LENGTH)


class LeaderboardRow(BaseModel):
    player_name: str
    mode: Mode
    games: int
    wins: int
    losses: int
    draws: int
    points: float


@router.post("/games")
def create_game(
    payload: GameCreate,
    request: Request,
    session: Session = Depends(get_session),
):
    check_rate_limit(request)

    name = normalize_name(payload.player_name)
    if len(name) < 2 or len(name) > 20:
        raise HTTPException(status_code=400, detail="player_name must be 2-20 chars")
    if not name.isprintable():
        raise HTTPException(status_code=400, detail="player_name has invalid characters")

    game = Game(
        player_name=name,
        result=payload.result,
        mode=payload.mode,
        pgn=payload.pgn,
        played_at=datetime.now(timezone.utc),
    )
    session.add(game)
    session.commit()
    session.refresh(game)
    return {"ok": True, "id": game.id}


@router.get("/leaderboard", response_model=list[LeaderboardRow])
def get_leaderboard(
    mode: Mode,
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
):
    wins = func.sum(case((Game.result == Result.win, 1), else_=0))
    losses = func.sum(case((Game.result == Result.loss, 1), else_=0))
    draws = func.sum(case((Game.result == Result.draw, 1), else_=0))

    # Group by exact stored name in SQL, then merge names that differ only by
    # case ("Bob" and "bob") in Python. SQLite lower() is ASCII-only, so doing
    # the merge here keeps names like "Äiti" and "äiti" together too.
    stmt = (
        select(
            Game.player_name,
            Game.mode,
            func.count(Game.id).label("games"),
            wins.label("wins"),
            losses.label("losses"),
            draws.label("draws"),
        )
        .where(Game.mode == mode)
        .group_by(Game.player_name, Game.mode)
    )

    merged: dict[str, dict] = {}
    for name, row_mode, games, w, l, d in session.exec(stmt).all():
        games, w, l, d = int(games or 0), int(w or 0), int(l or 0), int(d or 0)
        entry = merged.setdefault(
            normalize_name(name).casefold(),
            {"best_games": -1, "name": name, "mode": row_mode,
             "games": 0, "wins": 0, "losses": 0, "draws": 0},
        )
        if games > entry["best_games"]:  # display the spelling used most often
            entry["best_games"], entry["name"] = games, normalize_name(name)
        entry["games"] += games
        entry["wins"] += w
        entry["losses"] += l
        entry["draws"] += d

    rows = [
        LeaderboardRow(
            player_name=e["name"],
            mode=e["mode"],
            games=e["games"],
            wins=e["wins"],
            losses=e["losses"],
            draws=e["draws"],
            points=e["wins"] + 0.5 * e["draws"],
        )
        for e in merged.values()
    ]
    rows.sort(key=lambda r: (-r.points, -r.wins, -r.games, r.player_name.casefold()))
    return rows[:limit]
