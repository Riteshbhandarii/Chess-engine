from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from . import engine

app = FastAPI()

class MoveRequest(BaseModel):
    uci: str  # e.g. "e2e4"


@app.get("/", response_class=HTMLResponse)
def index():
    return """
    <html>
      <body>
        <h2>Minimal Chess UI</h2>
        <p>Board FEN: <span id="fen"></span></p>
        <input id="move" placeholder="e2e4"/>
        <button onclick="sendMove()">Play</button>
        <pre id="status"></pre>
        <script>
          async function refreshFen() {
            const res = await fetch('/fen');
            document.getElementById('fen').innerText = await res.text();
          }
          async function sendMove() {
            const m = document.getElementById('move').value;
            const res = await fetch('/move', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({uci: m})
            });
            document.getElementById('status').innerText = await res.text();
            await refreshFen();
          }
          refreshFen();
        </script>
      </body>
    </html>
    """


@app.get("/fen")
def fen():
    return engine.get_board_fen()


@app.post("/move")
def move(req: MoveRequest):
    ok = engine.make_move_uci(req.uci)
    if not ok:
        return "Illegal move"
    return "OK"
