import chess
import pytest
from fastapi.testclient import TestClient
from sqlmodel import create_engine

from src import db
from src.app import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    engine = create_engine(
        f"sqlite:///{tmp_path / 'leaderboard.db'}",
        connect_args={"check_same_thread": False},
    )
    monkeypatch.setattr(db, "engine", engine)
    with TestClient(app) as client:
        yield client
    engine.dispose()


def test_health_and_legal_moves(client):
    assert client.get("/").json()["status"] == "running"
    response = client.get("/legal_moves")
    assert response.status_code == 200
    assert len(response.json()["legal_moves"]) == 20


@pytest.mark.parametrize("moves,mode", [([], "bullet"), (["e2e4"], "rapid")])
def test_trained_engine_returns_legal_moves(client, moves, mode):
    response = client.post("/move", json={"moves": moves, "mode": mode})
    assert response.status_code == 200
    board = chess.Board()
    for uci in moves:
        board.push_uci(uci)
    assert chess.Move.from_uci(response.json()["move"]) in board.legal_moves


@pytest.mark.parametrize("moves", [["bad"], ["e2e5"], ["f2f3", "e7e5", "g2g4", "d8h4"]])
def test_invalid_or_finished_games_are_rejected(client, moves):
    response = client.post("/move", json={"moves": moves, "mode": "bullet"})
    assert response.status_code == 400


def test_game_result_is_saved_to_leaderboard(client):
    response = client.post("/games", json={
        "player_name": "Local tester", "result": "win", "mode": "rapid",
    })
    assert response.status_code == 200
    assert response.json()["ok"] is True
    rows = client.get("/leaderboard", params={"mode": "rapid"}).json()
    assert len(rows) == 1
    assert rows[0]["player_name"] == "Local tester"
    assert rows[0]["games"] == rows[0]["wins"] == 1
    assert rows[0]["points"] == 1.0
