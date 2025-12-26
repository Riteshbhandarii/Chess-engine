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
        setStatus("Engine error (check API terminal)");
        setBusy(false);
        return;
      }

      const data = await res.json();
      console.log("Engine response:", data);

      const uci = data.move; // expected like "e7e5" or "e7e8q"
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;

      // Only apply engine move if it is actually engine's turn (black)
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

      console.log("Engine moved:", engineMove);
      setPosition(game.fen());

      // IMPORTANT: append engine move to history so backend stays in sync
      const engineUci = `${from}${to}${engineMove.promotion || ""}`;
      setMoveHistory((prev) => [...prev, engineUci]);

      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          setStatus("Checkmate! Black wins!");
        } else if (game.isDraw()) {
          setStatus("Game drawn!");
        } else if (game.isStalemate()) {
          setStatus("Stalemate!");
        } else {
          setStatus("Game over!");
        }
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
    console.log("Drop attempt:", sourceSquare, "to", targetSquare);

    // Don't allow moves while engine is thinking
    if (busy) {
      console.log("Engine is thinking, please wait!");
      return false;
    }

    // Only allow white to move (player is white)
    if (game.turn() !== "w") {
      console.log("Not white's turn!");
      return false;
    }

    // Check if the piece being moved is white
    const piece = game.get(sourceSquare);
    if (!piece || piece.color !== "w") {
      console.log("Can only move white pieces!");
      return false;
    }

    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // OK for user moves; only used if pawn promotes
      });

      if (move === null) {
        console.log("Illegal move");
        return false;
      }

      console.log("Your move:", move);
      setPosition(game.fen());

      // Record UCI for player move
      const playerUci = `${sourceSquare}${targetSquare}${move.promotion || ""}`;

      // Compute the new full history and store it
      const nextHistory = [...moveHistory, playerUci];
      setMoveHistory(nextHistory);

      // If game ended, stop here
      if (game.isGameOver()) {
        if (game.isCheckmate()) {
          setStatus("Checkmate! White wins!");
        } else if (game.isDraw()) {
          setStatus("Game drawn!");
        } else if (game.isStalemate()) {
          setStatus("Stalemate!");
        } else {
          setStatus("Game over!");
        }
        return true;
      }

      // After white moves, it should be black to move; ask engine
      if (game.turn() === "b") {
        askEngine(nextHistory);
      } else {
        // Shouldn't happen, but avoids weird desync
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
    console.log("Reset game");
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
