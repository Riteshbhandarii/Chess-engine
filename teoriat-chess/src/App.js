import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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
        <h1 className="landingTitle">"The art of thinking ahead."</h1>
        <p className="landingSubtitle">"Every move is a choice."</p>
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

  const [previewWidth, setPreviewWidth] = useState(() => Math.min(640, Math.floor(window.innerWidth * 0.62)));

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
                Selected: {timeMode === "rapid" ? "10:00" : "1:00"} • {playerColor === "b" ? "Black" : "White"}
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
  const nav = useNavigate();

  const [position, setPosition] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const [boardWidth, setBoardWidth] = useState(() => Math.min(560, Math.floor(window.innerWidth * 0.92)));

  useEffect(() => {
    const onResize = () => setBoardWidth(Math.min(560, Math.floor(window.innerWidth * 0.92)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const engineColor = useMemo(() => (playerColor === "w" ? "b" : "w"), [playerColor]);
  const startSeconds = useMemo(() => (timeMode === "rapid" ? 10 * 60 : 60), [timeMode]);

  const [whiteMs, setWhiteMs] = useState(startSeconds * 1000);
  const [blackMs, setBlackMs] = useState(startSeconds * 1000);

  const [clockRunning, setClockRunning] = useState(true);
  const [activeColor, setActiveColor] = useState("w");

  const tickRef = useRef(null);
  const lastRef = useRef(performance.now());

  const [captured, setCaptured] = useState({ w: [], b: [] });

  const [resultOpen, setResultOpen] = useState(false);
  const [resultWinner, setResultWinner] = useState("");
  const [resultReason, setResultReason] = useState("");

  const [pendingPromotion, setPendingPromotion] = useState(null);

  /* sound */
  const moveSfxRef = useRef(null);
  const captureSfxRef = useRef(null);
  const checkSfxRef = useRef(null);
  const mateSfxRef = useRef(null);

  function playSfx(ref) {
    const a = ref.current;
    if (!a) return;

    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch {}
  }

  function playMoveSfx() {
    playSfx(moveSfxRef);
  }
  function playCaptureSfx() {
    playSfx(captureSfxRef);
  }
  function playCheckSfx() {
    playSfx(checkSfxRef);
  }
  function playMateSfx() {
    playSfx(mateSfxRef);
  }

  useEffect(() => {
    const audios = [moveSfxRef.current, captureSfxRef.current, checkSfxRef.current, mateSfxRef.current];
    for (const a of audios) {
      if (!a) continue;
      try {
        a.load();
      } catch {}
    }
  }, []);

  // Decide end-of-game result correctly (checkmate vs draw reasons)
  function getGameOverInfo(lastMoverColor) {
    if (game.isCheckmate && game.isCheckmate()) {
      const winner = lastMoverColor === "w" ? "White" : "Black";
      return { over: true, winner, reason: "CHECKMATED", isDraw: false };
    }

    if (game.isGameOver && game.isGameOver()) {
      // Any non-checkmate gameOver here is a draw (stalemate / repetition / 50-move / insufficient material)
      return { over: true, winner: "Draw", reason: "DRAW", isDraw: true };
    }

    return { over: false };
  }

  function applyPostMoveSfx(moveObj) {
    // Move vs capture
    if (moveObj && moveObj.captured) playCaptureSfx();
    else playMoveSfx();

    // If mate, play mate SFX (not check SFX)
    if (game.isCheckmate && game.isCheckmate()) {
      playMateSfx();
      return;
    }

    // Otherwise check sound
    if (game.inCheck && game.inCheck()) {
      playCheckSfx();
    }
  }

  const engineName = "TEORIAT";
  const topName = engineName;
  const bottomName = playerName;

  function fmtMs(ms) {
    const totalSec = Math.max(0, ms / 1000);
    const whole = Math.floor(totalSec);
    const mm = String(Math.floor(whole / 60)).padStart(1, "0");
    const ss = String(whole % 60).padStart(2, "0");
    const tenths = Math.floor((totalSec - whole) * 10);
    return `${mm}:${ss}.${tenths}`;
  }

  const playerClock = playerColor === "w" ? fmtMs(whiteMs) : fmtMs(blackMs);
  const engineClock = engineColor === "w" ? fmtMs(whiteMs) : fmtMs(blackMs);
  const topClock = engineClock;
  const bottomClock = playerClock;

  function uciToSanList(uciList) {
    const b = new Chess();
    const out = [];
    for (const uci of uciList) {
      const mv = b.move(uci, { sloppy: true });
      if (!mv) break;
      out.push(mv.san);
    }
    return out;
  }

  const sanMoves = useMemo(() => uciToSanList(moveHistory), [moveHistory]);

  const moveRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < sanMoves.length; i += 2) {
      rows.push({ no: Math.floor(i / 2) + 1, w: sanMoves[i] || "", b: sanMoves[i + 1] || "" });
    }
    return rows;
  }, [sanMoves]);

  const PIECE_GLYPH = {
    wp: "♙",
    wn: "♘",
    wb: "♗",
    wr: "♖",
    wq: "♕",
    wk: "♔",
    bp: "♟",
    bn: "♞",
    bb: "♝",
    br: "♜",
    bq: "♛",
    bk: "♚",
  };

  function recomputeCaptured() {
    const hist = game.history({ verbose: true });
    const cap = { w: [], b: [] };
    for (const m of hist) {
      if (!m.captured) continue;
      const capturedColor = m.color === "w" ? "b" : "w";
      cap[capturedColor].push(m.captured);
    }
    setCaptured(cap);
  }

  function CapturedRow({ title, items, color }) {
    return (
      <div className="capRow">
        <div className="capTitle">{title}</div>
        <div className="capPieces">
          {items.length === 0 ? (
            <div className="capEmpty">—</div>
          ) : (
            items.map((p, i) => (
              <span key={`${color}-${p}-${i}`} className={`capIcon ${color}`}>
                {PIECE_GLYPH[`${color}${p}`]}
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  function reasonLine(reason) {
    if (reason === "RESIGNED") return "By resignation.";
    if (reason === "TIMEOUT") return "On time.";
    if (reason === "DRAW") return "Draw.";
    return "By checkmate.";
  }

  function openResult(winner, reason) {
    setClockRunning(false);
    setBusy(false);
    setResultWinner(winner);
    setResultReason(reason);
    setResultOpen(true);
  }

  function startNewGame() {
    game.reset();
    setPosition("start");
    setMoveHistory([]);
    setCaptured({ w: [], b: [] });

    setWhiteMs(startSeconds * 1000);
    setBlackMs(startSeconds * 1000);
    setActiveColor("w");
    setClockRunning(true);

    setResultOpen(false);
    setResultWinner("");
    setResultReason("");
    setPendingPromotion(null);
    lastRef.current = performance.now();
  }

  function resign() {
    const winner = playerColor === "w" ? "Black" : "White";
    openResult(winner, "RESIGNED");
  }

  function leaderboard() {
    nav("/leaderboard");
  }

  useEffect(() => {
    setWhiteMs(startSeconds * 1000);
    setBlackMs(startSeconds * 1000);
    setClockRunning(true);
    setActiveColor("w");
    lastRef.current = performance.now();
    setCaptured({ w: [], b: [] });

    game.reset();
    setPosition("start");
    setMoveHistory([]);

    setResultOpen(false);
    setResultWinner("");
    setResultReason("");
    setPendingPromotion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startSeconds, playerColor]);

  useEffect(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    lastRef.current = performance.now();

    if (!clockRunning || resultOpen) return;

    tickRef.current = setInterval(() => {
      const now = performance.now();
      const dt = now - lastRef.current;
      lastRef.current = now;

      if (activeColor === "w") setWhiteMs((v) => Math.max(0, v - dt));
      else setBlackMs((v) => Math.max(0, v - dt));
    }, 50);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [clockRunning, activeColor, resultOpen]);

  useEffect(() => {
    if (resultOpen) return;
    if (whiteMs <= 0) openResult("Black", "TIMEOUT");
    else if (blackMs <= 0) openResult("White", "TIMEOUT");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [whiteMs, blackMs]);

  async function askEngine(movesSoFar) {
    setBusy(true);

    try {
      const res = await fetch("http://localhost:8000/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moves: movesSoFar, mode: timeMode }),
      });

      if (!res.ok) {
        setBusy(false);
        setActiveColor(playerColor);
        return;
      }

      const data = await res.json();
      const uci = data.move;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;

      if (!clockRunning || resultOpen) {
        setBusy(false);
        return;
      }

      if (game.turn() !== engineColor) {
        setBusy(false);
        setActiveColor(playerColor);
        return;
      }

      let engineMove;
      try {
        engineMove = game.move({ from, to, promotion });
      } catch {
        engineMove = null;
      }

      if (!engineMove) {
        setBusy(false);
        setActiveColor(playerColor);
        return;
      }

      setPosition(game.fen());
      recomputeCaptured();

      /* sound */
      applyPostMoveSfx(engineMove);

      const engineUci = `${from}${to}${engineMove.promotion || ""}`;
      setMoveHistory((prev) => [...prev, engineUci]);

      // Correct result handling
      const info = getGameOverInfo(engineColor);
      if (info.over) {
        openResult(info.winner, info.reason);
        return;
      }

      setActiveColor(playerColor);
      setBusy(false);
    } catch {
      setBusy(false);
      setActiveColor(playerColor);
    }
  }

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (busy) return false;
    if (!clockRunning || resultOpen) return false;
    if (game.turn() !== playerColor) return false;

    const sourcePiece = game.get(sourceSquare);
    if (!sourcePiece || sourcePiece.color !== playerColor) return false;

    const isPawn = sourcePiece.type === "p";
    const promotionRank = sourcePiece.color === "w" ? "8" : "1";
    const isPromotion = isPawn && targetSquare?.[1] === promotionRank;

    const promotionPiece = isPromotion && piece ? piece[1].toLowerCase() : undefined;

    const moveObj = isPromotion
      ? { from: sourceSquare, to: targetSquare, promotion: promotionPiece || "q" }
      : { from: sourceSquare, to: targetSquare };

    let move;
    try {
      move = game.move(moveObj);
    } catch {
      return false;
    }
    if (move === null) return false;

    setPosition(game.fen());
    recomputeCaptured();

    /* sound */
    applyPostMoveSfx(move);

    const playerUci = `${sourceSquare}${targetSquare}${move.promotion || ""}`;
    const nextHistory = [...moveHistory, playerUci];
    setMoveHistory(nextHistory);

    // Correct result handling
    const info = getGameOverInfo(playerColor);
    if (info.over) {
      openResult(info.winner, info.reason);
      return true;
    }

    setActiveColor(engineColor);
    askEngine(nextHistory);
    return true;
  }

  function isDraggablePiece({ piece }) {
    return !busy && clockRunning && !resultOpen && game.turn() === playerColor && piece[0].toLowerCase() === playerColor;
  }

  useEffect(() => {
    if (playerColor === "b" && game.turn() === "w" && moveHistory.length === 0) {
      setActiveColor("w");
      askEngine([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="app appBg"
      style={{
        "--playBg": `url(${process.env.PUBLIC_URL}/The_Chess_Players_MET_DT1506.jpg)`,
      }}
    >
      {/* sound */}
      <audio ref={moveSfxRef} preload="auto" src={`${process.env.PUBLIC_URL}/peace_move.wav`} />
      <audio ref={captureSfxRef} preload="auto" src={`${process.env.PUBLIC_URL}/capture.wav`} />
      <audio ref={checkSfxRef} preload="auto" src={`${process.env.PUBLIC_URL}/check.mp3`} />
      <audio ref={mateSfxRef} preload="auto" src={`${process.env.PUBLIC_URL}/checkmate.mp3`} />

      {resultOpen && <div className="gameOverDim" aria-hidden="true" />}

      <div className="container playBox">
        <div className="playGrid">
          <div className="playMain">
            <div className="playHudRow">
              <div className="playHudName">{topName}</div>
              <div className="playHudClock">{topClock}</div>
            </div>

            <CapturedRow title="Captured (White)" items={captured.w} color="w" />

            <div className="boardWrap">
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

              {resultOpen && (
                <div className="gameOverOnBoard" role="dialog" aria-modal="true" aria-label="Result">
                  <div className="gameOverPanelBoard">
                    <div className="resultKicker">Result</div>
                    <div className="resultMain">{resultWinner === "Draw" ? "Draw." : `${resultWinner} wins.`}</div>
                    <div className="resultSub">{reasonLine(resultReason)}</div>

                    <div className="gameOverActions">
                      <button type="button" className="gameOverBtnPrimary" onClick={startNewGame}>
                        REMATCH
                      </button>
                      <button type="button" className="gameOverBtnGhost" onClick={leaderboard}>
                        LEADERBOARD
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <CapturedRow title="Captured (Black)" items={captured.b} color="b" />

            <div className="playHudRow">
              <div className="playHudName">{bottomName}</div>
              <div className="playHudClock">{bottomClock}</div>
            </div>
          </div>

          <aside className="sidePanelPlay" aria-label="Moves">
            <div className="sidePanelHeader">
              <div className="sidePanelTitle">Moves</div>
              <button type="button" className="resignBtn" onClick={resign}>
                Resign
              </button>
            </div>

            <div className="sideMoves">
              {moveRows.length === 0 ? (
                <div className="sideEmpty">No moves yet.</div>
              ) : (
                moveRows.map((r) => (
                  <div key={r.no} className="sideMoveRow">
                    <div className="sideMoveNo">{r.no}.</div>
                    <div className="sideMoveW">{r.w}</div>
                    <div className="sideMoveB">{r.b}</div>
                  </div>
                ))
              )}
            </div>
          </aside>
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