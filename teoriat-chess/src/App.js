import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./App.css";

function Landing({ playerName, setPlayerName }) {
  const nav = useNavigate();
  const [localName, setLocalName] = useState(playerName);

  function submit(e) {
    e.preventDefault();
    const name = localName.trim();
    if (!name) return;
    setPlayerName(name);
    nav("/side");
  }

  return (
    <div
  className="landing"
  style={{
    "--landingBg": `url(${process.env.PUBLIC_URL}/design-01kdh2xh6d-1766878817.png)`,
  }}
>
      <form className="landingBox" onSubmit={submit}>
        <input
          className="landingInput"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          placeholder="Type your username"
          autoFocus
        />
        <button className="landingPrimary" type="submit">
          Continue
        </button>
      </form>
    </div>
  );
}



function SideSelect({ playerName, playerColor, setPlayerColor }) {
  const nav = useNavigate();

  function pick(color) {
    setPlayerColor(color);
    nav("/play");
  }

  return (
    <div className="shell">
      <div className="card">
        <div className="topbar">
          <h2 className="title">Choose side</h2>
          <button className="linkBtn" onClick={() => nav("/")}>
            Back
          </button>
        </div>

        <div className="text" style={{ marginBottom: 12 }}>
          Playing as: {playerName}
        </div>

        <div className="row">
          <button
            className={`choice ${playerColor === "w" ? "active" : ""}`}
            onClick={() => pick("w")}
          >
            White
          </button>
          <button
            className={`choice ${playerColor === "b" ? "active" : ""}`}
            onClick={() => pick("b")}
          >
            Black
          </button>
        </div>
      </div>
    </div>
  );
}

function About() {
  const nav = useNavigate();

  return (
    <div className="shell">
      <div className="card">
        <div className="topbar">
          <h2 className="title">About</h2>
          <button className="linkBtn" onClick={() => nav("/")}>
            Back
          </button>
        </div>

        <div className="text">
          <p>
            TEORIAT is a personal chess engine project built to imitate my own move
            choices while filtering out obvious blunders.
          </p>
          <p>
            I built it to learn ML-driven gameplay, deploy it as an API, and make a
            clean UI for testing and playing.
          </p>
        </div>
      </div>
    </div>
  );
}

function Play({ playerName, playerColor }) {
  const [game] = useState(() => new Chess());
  const [position, setPosition] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState(
    playerColor === "w" ? "Your move (White)" : "Engine thinking..."
  );
  const [busy, setBusy] = useState(false);

  // Responsive board width for mobile/desktop. react-chessboard sizes from boardWidth. [web:118]
  const [boardWidth, setBoardWidth] = useState(() =>
    Math.min(560, Math.floor(window.innerWidth * 0.92))
  );

  useEffect(() => {
    const onResize = () => setBoardWidth(Math.min(560, Math.floor(window.innerWidth * 0.92)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const engineColor = useMemo(() => (playerColor === "w" ? "b" : "w"), [playerColor]);

  async function askEngine(movesSoFar) {
    setBusy(true);
    setStatus("Engine thinking...");

    try {
      const res = await fetch("http://localhost:8000/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: movesSoFar }),
      });

      if (!res.ok) {
        let errText = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          if (err?.detail) errText = err.detail;
        } catch {}
        setStatus(`Engine error: ${errText}`);
        setBusy(false);
        return;
      }

      const data = await res.json();

      const uci = data.move;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;

      if (game.turn() !== engineColor) {
        setStatus("State desync (wrong turn). Reset and try again.");
        setBusy(false);
        return;
      }

      let engineMove;
      try {
        engineMove = game.move({ from, to, promotion });
      } catch {
        engineMove = null;
      }

      if (!engineMove) {
        setStatus(`Engine gave illegal move: ${uci}`);
        setBusy(false);
        return;
      }

      setPosition(game.fen());

      const engineUci = `${from}${to}${engineMove.promotion || ""}`;
      setMoveHistory((prev) => [...prev, engineUci]);

      if (game.isGameOver()) {
        if (game.isCheckmate()) setStatus("Checkmate!");
        else if (game.isDraw()) setStatus("Game drawn!");
        else if (game.isStalemate()) setStatus("Stalemate!");
        else setStatus("Game over!");
      } else {
        setStatus(playerColor === "w" ? "Your move (White)" : "Your move (Black)");
      }

      setBusy(false);
    } catch {
      setStatus("Engine offline / CORS / network error");
      setBusy(false);
    }
  }

  function onPieceDrop(sourceSquare, targetSquare) {
    if (busy) return false;
    if (game.turn() !== playerColor) return false;

    const piece = game.get(sourceSquare);
    if (!piece || piece.color !== playerColor) return false;

    // Promotion only when a pawn reaches last rank. chess.js uses promotion only for that. [web:100]
    const isPawn = piece.type === "p";
    const promotionRank = piece.color === "w" ? "8" : "1";
    const isPromotion = isPawn && targetSquare?.[1] === promotionRank;

    const moveObj = isPromotion
      ? { from: sourceSquare, to: targetSquare, promotion: "q" }
      : { from: sourceSquare, to: targetSquare };

    let move;
    try {
      move = game.move(moveObj);
    } catch {
      // Illegal move -> snap back (no red overlay).
      return false;
    }

    if (move === null) return false;

    setPosition(game.fen());

    const playerUci = `${sourceSquare}${targetSquare}${move.promotion || ""}`;
    const nextHistory = [...moveHistory, playerUci];
    setMoveHistory(nextHistory);

    if (game.isGameOver()) {
      if (game.isCheckmate()) setStatus("Checkmate!");
      else if (game.isDraw()) setStatus("Game drawn!");
      else if (game.isStalemate()) setStatus("Stalemate!");
      else setStatus("Game over!");
      return true;
    }

    askEngine(nextHistory);
    return true;
  }

  function isDraggablePiece({ piece }) {
    return !busy && game.turn() === playerColor && piece[0].toLowerCase() === playerColor;
  }

  function reset() {
    game.reset();
    setPosition(game.fen());
    setMoveHistory([]);
    setBusy(false);
    setStatus(playerColor === "w" ? "Your move (White)" : "Engine thinking...");
  }

  useEffect(() => {
    if (playerColor === "b" && game.turn() === "w" && moveHistory.length === 0) {
      askEngine([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      <div className="stars" />
      <div className="container">
        <div className="topbar">
          <h1>TEORIAT</h1>
          <div className="status">
            {playerName} ({playerColor === "w" ? "White" : "Black"})
          </div>
        </div>

        <Chessboard
          position={position}
          onPieceDrop={onPieceDrop}
          isDraggablePiece={isDraggablePiece}
          boardWidth={boardWidth}
          boardOrientation={playerColor === "w" ? "white" : "black"}
          customDarkSquareStyle={{ backgroundColor: "#b58863" }}
          customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        />

        <div className="controls">
          <button onClick={reset} disabled={busy}>
            New Game
          </button>
          <div className="status">{status}</div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState(null);

  return (
    <Routes>
      <Route path="/" element={<Landing playerName={playerName} setPlayerName={setPlayerName} />} />
      <Route path="/about" element={<About />} />
      <Route
        path="/side"
        element={
          playerName ? (
            <SideSelect
              playerName={playerName}
              playerColor={playerColor}
              setPlayerColor={setPlayerColor}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/play"
        element={
          playerName && playerColor ? (
            <Play playerName={playerName} playerColor={playerColor} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}
