import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import "./App.css";

function Landing({ playerName, setPlayerName }) {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function go(path) {
    setMenuOpen(false);
    nav(path);
  }

  return (
    <div
      className="landing"
      style={{
        "--landingBg": `url(${process.env.PUBLIC_URL}/design-01kdh2xh6d-1766878817.png)`,
      }}
    >
      <button
        type="button"
        className="landingMenuBtn"
        aria-expanded={menuOpen}
        aria-controls="landingMenuPanel"
        onClick={() => setMenuOpen((v) => !v)}
      >
        Menu
      </button>

      <div
        id="landingMenuPanel"
        className={`landingMenuPanel ${menuOpen ? "open" : ""}`}
        role="menu"
        aria-label="Landing menu"
      >
        <button type="button" className="landingMenuItem" role="menuitem" onClick={() => go("/about")}>
          About
        </button>
        <button type="button" className="landingMenuItem" role="menuitem" onClick={() => go("/how")}>
          How to play
        </button>
        <button type="button" className="landingMenuItem" role="menuitem" onClick={() => go("/feedback")}>
          Feedback
        </button>
        <button type="button" className="landingMenuItem" role="menuitem" onClick={() => go("/leaderboard")}>
          Leaderboard
        </button>
      </div>

      {menuOpen && <div className="landingMenuBackdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className="landingHero">
        <h1 className="landingTitle">“The art of thinking ahead.”</h1>
        <p className="landingSubtitle">“Every move is a choice.”</p>
      </div>

      <div className="landingBox">
        <button type="button" className="landingBegin" onClick={() => nav("/signin")}>
          Begin
        </button>
      </div>
    </div>
  );
}

function SignIn({ playerName, setPlayerName }) {
  const nav = useNavigate();
  const [name, setName] = useState(playerName || "");

  function submit(e) {
    e.preventDefault();
    const v = name.trim();
    if (!v) return;
    setPlayerName(v);
    nav("/side");
  }

  return (
    <div
      className="signin"
      style={{
        "--landingBg": `url(${process.env.PUBLIC_URL}/Honoré_Daumier_032.jpg)`,
      }}
    >
      <button className="landingMenuBtn signinBackGlobal" type="button" onClick={() => nav("/")}>
        Back
      </button>

      <div className="signinCard">
        <h2 className="signinTitle">Choose a username</h2>

        <form className="signinForm" onSubmit={submit}>
          <label className="signinLabel" htmlFor="username">
            Username:
          </label>

          <input
            id="username"
            className="signinInput"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="  No personal info Needed.."
            autoComplete="username"
            maxLength={20}
          />

          <div className="signinHint">This name will be shown on the leaderboard.</div>

          <button className="landingBegin" type="submit">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

function HowToPlay() {
  const nav = useNavigate();
  return (
    <div className="shell">
      <div className="card">
        <div className="topbar">
          <h2 className="title">How to play</h2>
          <button className="linkBtn" onClick={() => nav("/")}>
            Back
          </button>
        </div>

        <div className="text">
          <p>1) Enter username.</p>
          <p>2) Choose side + time.</p>
          <p>3) Make a move; engine responds.</p>
          <p>Tip: Drag and drop pieces to move.</p>
        </div>
      </div>
    </div>
  );
}

function Feedback() {
  const nav = useNavigate();
  return (
    <div className="shell">
      <div className="card">
        <div className="topbar">
          <h2 className="title">Feedback</h2>
          <button className="linkBtn" onClick={() => nav("/")}>
            Back
          </button>
        </div>

        <div className="text">
          <p>Send feedback to: your@email.com</p>
          <p>(Replace with your real contact or a form later.)</p>
        </div>
      </div>
    </div>
  );
}

function Leaderboard() {
  const nav = useNavigate();
  return (
    <div className="shell">
      <div className="card">
        <div className="topbar">
          <h2 className="title">Leaderboard</h2>
          <button className="linkBtn" onClick={() => nav("/")}>
            Back
          </button>
        </div>

        <div className="text">
          <p>Coming soon.</p>
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
            TEORIAT is a personal chess engine project built to imitate my own move choices while filtering out obvious
            blunders.
          </p>
          <p>I built it to learn ML-driven gameplay, deploy it as an API, and make a clean UI for testing and playing.</p>
        </div>
      </div>
    </div>
  );
}

function SideSelect({ playerName, playerColor, setPlayerColor, timeMode, setTimeMode }) {
  const nav = useNavigate();

  const [previewWidth, setPreviewWidth] = useState(() =>
    Math.min(640, Math.floor(window.innerWidth * 0.62))
  );

  useEffect(() => {
    const onResize = () => setPreviewWidth(Math.min(640, Math.floor(window.innerWidth * 0.62)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function start(color) {
    setPlayerColor(color);
    nav("/play");
  }

  return (
    <div
      className="shell shellBg"
      style={{
        "--shellBg": `url(${process.env.PUBLIC_URL}/The_Chess_Players_MET_DT1506.jpg)`,
      }}
    >
      <div className="card sideLayout">
        <div className="topbar">
          <h2 className="title">Game settings</h2>
          <button className="linkBtn" onClick={() => nav("/")}>
            Back
          </button>
        </div>

        <div className="text sideMeta">Playing as: {playerName}</div>

        <div className="sideGrid">
          <div className="sideLeft">
            <Chessboard
              position="start"
              boardWidth={previewWidth}
              arePiecesDraggable={false}
              boardOrientation={playerColor === "b" ? "black" : "white"}
              customDarkSquareStyle={{ backgroundColor: "#b58863" }}
              customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
            />
          </div>

          <div className="sideRight">
            <div className="sidePanel">
              <div className="sideSectionTitle">Time</div>

              <div className="sideToggle">
                <button
                  type="button"
                  className={`landingBegin sideBtnWide ${timeMode === "rapid" ? "active" : ""}`}
                  onClick={() => setTimeMode("rapid")}
                  aria-pressed={timeMode === "rapid"}
                >
                  10 min (Rapid)
                </button>

                <button
                  type="button"
                  className={`landingBegin sideBtnWide ${timeMode === "bullet" ? "active" : ""}`}
                  onClick={() => setTimeMode("bullet")}
                  aria-pressed={timeMode === "bullet"}
                >
                  1 min (Bullet)
                </button>
              </div>

              <div className="sideSectionTitle" style={{ marginTop: 14 }}>
                Side
              </div>

              <div className="sideToggle">
                <button
                  type="button"
                  className={`landingBegin sideBtnWide ${playerColor === "w" ? "active" : ""}`}
                  onClick={() => start("w")}
                  aria-pressed={playerColor === "w"}
                >
                  Play White
                </button>

                <button
                  type="button"
                  className={`landingBegin sideBtnWide ${playerColor === "b" ? "active" : ""}`}
                  onClick={() => start("b")}
                  aria-pressed={playerColor === "b"}
                >
                  Play Black
                </button>
              </div>

              <div className="text" style={{ marginTop: 12, opacity: 0.85 }}>
                Selected: {timeMode === "rapid" ? "10:00" : "1:00"} •{" "}
                {playerColor === "b" ? "Black" : "White"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Play({ playerName, playerColor, timeMode }) {
  const [game] = useState(() => new Chess());
  const [position, setPosition] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const [boardWidth, setBoardWidth] = useState(() =>
    Math.min(560, Math.floor(window.innerWidth * 0.92))
  );

  useEffect(() => {
    const onResize = () => setBoardWidth(Math.min(560, Math.floor(window.innerWidth * 0.92)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const engineColor = useMemo(() => (playerColor === "w" ? "b" : "w"), [playerColor]);

  // --- Timers (simple countdown, no increment) ---
  const startSeconds = useMemo(() => (timeMode === "rapid" ? 10 * 60 : 60), [timeMode]);
  const [whiteSec, setWhiteSec] = useState(startSeconds);
  const [blackSec, setBlackSec] = useState(startSeconds);
  const [clockRunning, setClockRunning] = useState(true);

  useEffect(() => {
    // when mode changes / new game mounts
    setWhiteSec(startSeconds);
    setBlackSec(startSeconds);
    setClockRunning(true);
  }, [startSeconds]);

  function fmt(sec) {
    const s = Math.max(0, sec);
    const mm = String(Math.floor(s / 60)).padStart(1, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  const engineName = "TEORIAT";
  const topName = engineName;
  const bottomName = playerName;

  const topClock =
    engineColor === "w" ? fmt(whiteSec) : fmt(blackSec);

  const bottomClock =
    playerColor === "w" ? fmt(whiteSec) : fmt(blackSec);

  useEffect(() => {
    if (!clockRunning) return;

    const t = setInterval(() => {
      const turn = game.turn(); // "w" | "b"
      if (turn === "w") setWhiteSec((v) => (v > 0 ? v - 1 : 0));
      else setBlackSec((v) => (v > 0 ? v - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [clockRunning, game]);

  async function askEngine(movesSoFar) {
    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("http://localhost:8000/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: movesSoFar, mode: timeMode }),
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
        setClockRunning(false);
        if (game.isCheckmate()) setStatus("Checkmate!");
        else if (game.isDraw()) setStatus("Game drawn!");
        else if (game.isStalemate()) setStatus("Stalemate!");
        else setStatus("Game over!");
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
      return false;
    }
    if (move === null) return false;

    setPosition(game.fen());

    const playerUci = `${sourceSquare}${targetSquare}${move.promotion || ""}`;
    const nextHistory = [...moveHistory, playerUci];
    setMoveHistory(nextHistory);

    if (game.isGameOver()) {
      setClockRunning(false);
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
    setStatus("");

    setWhiteSec(startSeconds);
    setBlackSec(startSeconds);
    setClockRunning(true);
  }

  useEffect(() => {
    if (playerColor === "b" && game.turn() === "w" && moveHistory.length === 0) {
      askEngine([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="app"
      style={{
        background: "url(/The_Chess_Players_MET_DT1506.jpg) center / cover no-repeat",
      }}
    >
      <div className="container playBox">
        {/* TOP (engine) */}
        <div className="playHudRow">
          <div className="playHudName">{topName}</div>
          <div className="playHudClock">{topClock}</div>
        </div>

        {/* BOARD */}
        <div className="boardTopLeft">
          <Chessboard
            position={position}
            onPieceDrop={onPieceDrop}
            isDraggablePiece={isDraggablePiece}
            boardWidth={boardWidth}
            boardOrientation={playerColor === "w" ? "white" : "black"}
            customDarkSquareStyle={{ backgroundColor: "#b58863" }}
            customLightSquareStyle={{ backgroundColor: "#f0d9b5" }}
          />
        </div>

        {/* BOTTOM (player) */}
        <div className="playHudRow">
          <div className="playHudName">{bottomName}</div>
          <div className="playHudClock">{bottomClock}</div>
        </div>

        {/* Controls (kept minimal) */}
        <div className="controls">
          <button onClick={reset} disabled={busy}>
            New Game
          </button>
          {status ? <div className="status">{status}</div> : <div className="status" style={{ opacity: 0.5 }} />}
        </div>
      </div>
    </div>
  );
}


export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState(null);
  const [timeMode, setTimeMode] = useState("rapid");

  return (
    <Routes>
      <Route path="/" element={<Landing playerName={playerName} setPlayerName={setPlayerName} />} />
      <Route path="/signin" element={<SignIn playerName={playerName} setPlayerName={setPlayerName} />} />
      <Route path="/about" element={<About />} />
      <Route path="/how" element={<HowToPlay />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/leaderboard" element={<Leaderboard />} />

      <Route
        path="/side"
        element={
          playerName ? (
            <SideSelect
              playerName={playerName}
              playerColor={playerColor}
              setPlayerColor={setPlayerColor}
              timeMode={timeMode}
              setTimeMode={setTimeMode}
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
            <Play playerName={playerName} playerColor={playerColor} timeMode={timeMode} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}
