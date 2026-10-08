from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "running"


def test_legal_moves_start_position():
    r = client.get("/legal_moves")
    assert r.status_code == 200
    assert len(r.json()["legal_moves"]) == 20


def test_legal_moves_rejects_illegal_move():
    r = client.get("/legal_moves", params={"moves": "e2e5"})
    assert r.status_code == 400


def test_move_returns_legal_move():
    r = client.post("/move", json={"moves": ["e2e4"], "mode": "bullet"})
    assert r.status_code == 200
    legal = client.get("/legal_moves", params={"moves": "e2e4"}).json()["legal_moves"]
    assert r.json()["move"] in legal
