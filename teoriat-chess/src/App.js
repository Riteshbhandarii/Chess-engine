import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./App.css";

export default function App() {
  const [game] = useState(() => new Chess());
  const [position, setPosition] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState("Your move (White)");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    console.log("Component mounted!");
  }, []);

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
          console.log("API error:", err);
          if (err?.detail) errText = err.detail;
        } catch {
          // ignore JSON parse errors
        }
        setStatus(`Engine error: ${errText}`);
        setBusy(false);
        return;
      }

      const data = await res.json();
      console.log("Engine response:", data);

      const uci = data.move;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;

      if (game.turn() !== "b") {
        console.warn("Engine move received but it's not black's turn.");
        setStatus("State desync (not black's turn). Reset and try again.");
        setBusy(false);
        return;
      }

      const engineMove = game.move({ from, to, promotion });

      if (!engineMove) {
        setStatus(`Engine gave illegal move: ${uci}`);
        setBusy(false);
        return;
      }

      setPosition(game.fen());

      const engineUci = `${from}${to}${engineMove.promotion || ""}`;
      setMoveHistory((prev) => [...prev, engineUci]);

      if (game.isGameOver()) {
        if (game.isCheckmate()) setStatus("Checkmate! Black wins!");
        else if (game.isDraw()) setStatus("Game drawn!");
        else if (game.isStalemate()) setStatus("Stalemate!");
        else setStatus("Game over!");
      } else {
        setStatus("Your move (White)");
      }

      setBusy(false);
    } catch (e) {
      console.error("Engine error:", e);
      setStatus("Engine offline / CORS / network error");
      setBusy(false);
    }
  }

  function onPieceDrop(sourceSquare, targetSquare) {
    if (busy) return false;
    if (game.turn() !== "w") return false;

    const piece = game.get(sourceSquare);
    if (!piece || piece.color !== "w") return false;

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) return false;

      setPosition(game.fen());

      const playerUci = `${sourceSquare}${targetSquare}${move.promotion || ""}`;
      const nextHistory = [...moveHistory, playerUci];
      setMoveHistory(nextHistory);

      if (game.isGameOver()) {
        if (game.isCheckmate()) setStatus("Checkmate! White wins!");
        else if (game.isDraw()) setStatus("Game drawn!");
        else if (game.isStalemate()) setStatus("Stalemate!");
        else setStatus("Game over!");
        return true;
      }

      if (game.turn() === "b") {
        askEngine(nextHistory);
      } else {
        setStatus("State desync (expected black to move).");
      }

      return true;
    } catch (error) {
      console.error("Move error:", error);
      return false;
    }
  }

  function isDraggablePiece({ piece }) {
    return !busy && game.turn() === "w" && piece[0] === "w";
  }

  function reset() {
    game.reset();
    setPosition(game.fen());
    setMoveHistory([]);
    setBusy(false);
    setStatus("Your move (White)");
  }

  return (
    <div className="app">
      <div className="stars" />
      <div className="container">
        <h1>TEORIAT</h1>

        <Chessboard
          position={position}
          onPieceDrop={onPieceDrop}
          isDraggablePiece={isDraggablePiece}
          boardWidth={500}
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
