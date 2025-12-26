import { useState, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./App.css";

export default function App() {
  const [game] = useState(() => new Chess());
  const [position, setPosition] = useState("start");

  useEffect(() => {
    console.log("Component mounted!");
    console.log("Chess.js version check - game object:", game);
    console.log("Starting position:", game.fen());
  }, [game]);

  function onPieceDrop(sourceSquare, targetSquare) {
    console.log("===================");
    console.log("DROP EVENT TRIGGERED!");
    console.log("From:", sourceSquare);
    console.log("To:", targetSquare);
    console.log("===================");
    
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move === null) {
        console.log("❌ Move REJECTED - illegal move");
        return false;
      }

      console.log("✅ Move ACCEPTED:", move);
      setPosition(game.fen());
      return true;
    } catch (error) {
      console.error("❌ ERROR during move:", error);
      return false;
    }
  }

  function onSquareClick(square) {
    console.log("🖱️ Square clicked:", square);
  }

  function onPieceDragBegin(piece, sourceSquare) {
    console.log("🎯 DRAG STARTED - Piece:", piece, "From:", sourceSquare);
  }

  function onPieceDragEnd(piece, sourceSquare) {
    console.log("🎯 DRAG ENDED - Piece:", piece, "From:", sourceSquare);
  }

  function reset() {
    console.log("🔄 Reset button clicked");
    game.reset();
    setPosition(game.fen());
  }

  console.log("🔄 Render - Current position:", position);

  return (
    <div className="app">
      <div className="stars" />
      <div className="container">
        <h1>TEORIAT</h1>
        
        <div style={{ 
          marginBottom: "20px", 
          color: "#e8e8e8", 
          background: "rgba(0,0,0,0.3)",
          padding: "15px",
          borderRadius: "8px",
          fontSize: "14px"
        }}>
          <p><strong>🔍 DEBUG MODE - Open Console (F12)</strong></p>
          <p>✓ Try dragging white pieces</p>
          <p>✓ Check console for logs</p>
          <p>✓ Current turn: White</p>
        </div>

        <Chessboard
          position={position}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          onPieceDragBegin={onPieceDragBegin}
          onPieceDragEnd={onPieceDragEnd}
          boardWidth={500}
          customDarkSquareStyle={{ backgroundColor: "#b58863" }}
          customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
        />

        <div className="controls">
          <button onClick={reset}>New Game</button>
          <div className="status">Debug mode active</div>
        </div>
      </div>
    </div>
  );
}