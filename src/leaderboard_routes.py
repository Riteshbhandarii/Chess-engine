from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select, func, case

from .db import get_session
from .models import Game

router = APIRouter(tags=["leaderboard"])

Result = Literal["win", "loss", "draw"]
Mode = Literal["bullet", "rapid"]


class GameCreate(BaseModel):
    player_name: str
    result: Result
    mode: Mode
    pgn: str | None = None


class LeaderboardRow(BaseModel):
    player_name: str
    mode: Mode
    games: int
    wins: int
    losses: int
    draws: int
    points: float


@router.post("/games")
def create_game(payload: GameCreate, session: Session = Depends(get_session)):
    name = payload.player_name.strip()
    if len(name) < 2 or len(name) > 20:
        raise HTTPException(status_code=400, detail="player_name must be 2-20 chars")

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
    limit: int = 50,
    session: Session = Depends(get_session),
):
    wins = func.sum(case((Game.result == "win", 1), else_=0))
    losses = func.sum(case((Game.result == "loss", 1), else_=0))
    draws = func.sum(case((Game.result == "draw", 1), else_=0))

    points = wins * 1.0 + draws * 0.5

    stmt = (
        select(
            Game.player_name,
            Game.mode,
            func.count(Game.id).label("games"),
            wins.label("wins"),
            losses.label("losses"),
            draws.label("draws"),
            points.label("points"),
        )
        .where(Game.mode == mode)
        .group_by(Game.player_name, Game.mode)
        .order_by(points.desc(), wins.desc(), func.count(Game.id).desc())
        .limit(limit)
    )

    rows = session.exec(stmt).all()
    return [
        LeaderboardRow(
            player_name=r[0],
            mode=r[1],
            games=int(r[2] or 0),
            wins=int(r[3] or 0),
            losses=int(r[4] or 0),
            draws=int(r[5] or 0),
            points=float(r[6] or 0.0),
        )
        for r in rows
    ]
