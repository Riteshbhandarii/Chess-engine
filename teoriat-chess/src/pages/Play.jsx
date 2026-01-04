import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";

export default function Play({ playerName, playerColor, timeMode }) {
  const [game] = useState(() => new Chess());
  const nav = useNavigate();

  const [position, setPosition] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const [gameId, setGameId] = useState(0);

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

    // NEW: triggers engine-first useEffect after rematch
    setGameId((x) => x + 1);
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

  // engine-first move runs after every rematch (gameId increments)
  useEffect(() => {
    if (playerColor !== "b") return; // engine is white
    if (resultOpen || !clockRunning || busy) return;

    // On a fresh game it is white to move and no history
    if (game.turn() !== "w") return;
    if (moveHistory.length !== 0) return;

    setActiveColor("w");
    askEngine([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, playerColor]);

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
