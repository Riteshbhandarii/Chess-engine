import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from src import leaderboard_routes
from src.db import get_session


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)

    def override():
        with Session(engine) as session:
            yield session

    app = FastAPI()
    app.include_router(leaderboard_routes.router)
    app.dependency_overrides[get_session] = override
    leaderboard_routes.reset_rate_limit()
    yield TestClient(app)
    leaderboard_routes.reset_rate_limit()


def post(client, name="Bob", result="win", mode="rapid", **kw):
    return client.post(
        "/games", json={"player_name": name, "result": result, "mode": mode}, **kw
    )


def test_post_keeps_frontend_contract(client):
    r = client.post(
        "/games",
        json={"player_name": "Ritesh", "result": "win", "mode": "bullet", "pgn": "1. e4"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True and isinstance(body["id"], int)

    rows = client.get("/leaderboard", params={"mode": "bullet"}).json()
    assert rows == [
        {"player_name": "Ritesh", "mode": "bullet", "games": 1,
         "wins": 1, "losses": 0, "draws": 0, "points": 1.0}
    ]


def test_case_insensitive_grouping(client):
    post(client, "Bob", "win")
    post(client, "bob", "win")
    post(client, "BOB ", "draw")
    post(client, "Bob", "loss")
    rows = client.get("/leaderboard", params={"mode": "rapid"}).json()
    assert len(rows) == 1
    assert rows[0]["player_name"] == "Bob"
    assert (rows[0]["games"], rows[0]["wins"], rows[0]["draws"], rows[0]["losses"]) == (4, 2, 1, 1)
    assert rows[0]["points"] == 2.5


def test_non_ascii_case_grouping(client):
    post(client, "Äiti", "win")
    post(client, "äiti", "win")
    rows = client.get("/leaderboard", params={"mode": "rapid"}).json()
    assert len(rows) == 1 and rows[0]["games"] == 2


def test_inner_whitespace_collapsed(client):
    post(client, "  Mary   Jane ", "win")
    rows = client.get("/leaderboard", params={"mode": "rapid"}).json()
    assert rows[0]["player_name"] == "Mary Jane"


def test_modes_are_separate(client):
    post(client, "Bob", "win", "bullet")
    post(client, "Bob", "win", "rapid")
    assert len(client.get("/leaderboard", params={"mode": "bullet"}).json()) == 1


@pytest.mark.parametrize(
    "payload",
    [
        {"player_name": "Bob", "result": "cheat", "mode": "rapid"},
        {"player_name": "Bob", "result": "win", "mode": "blitz"},
        {"player_name": "Bob", "result": "win"},
        {"player_name": "Bob", "result": "win", "mode": "rapid", "pgn": "x" * 20_001},
    ],
)
def test_invalid_payload_rejected(client, payload):
    assert client.post("/games", json=payload).status_code == 422


@pytest.mark.parametrize("name", ["B", " ", "x" * 21, "bad\x00name"])
def test_invalid_name_rejected(client, name):
    assert post(client, name).status_code == 400


def test_rate_limit_per_ip(client):
    for _ in range(leaderboard_routes.RATE_LIMIT_MAX):
        assert post(client).status_code == 200
    r = post(client)
    assert r.status_code == 429
    assert int(r.headers["retry-after"]) >= 1
    # another client IP is not affected
    assert post(client, headers={"x-forwarded-for": "203.0.113.9"}).status_code == 200
    # rejected requests were not stored
    rows = client.get("/leaderboard", params={"mode": "rapid"}).json()
    assert rows[0]["games"] == leaderboard_routes.RATE_LIMIT_MAX + 1


def test_rate_limit_window_expires(client, monkeypatch):
    t = [1000.0]
    monkeypatch.setattr(leaderboard_routes.time, "monotonic", lambda: t[0])
    for _ in range(leaderboard_routes.RATE_LIMIT_MAX):
        post(client)
    assert post(client).status_code == 429
    t[0] += leaderboard_routes.RATE_LIMIT_WINDOW_SECONDS + 1
    assert post(client).status_code == 200


def test_leaderboard_limit_validated(client):
    assert client.get("/leaderboard", params={"mode": "rapid", "limit": 0}).status_code == 422
