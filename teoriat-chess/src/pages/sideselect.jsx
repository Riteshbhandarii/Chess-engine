import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";

import "./Generic.css";
import "./SideSelect.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

export default function SideSelect({ playerName, playerColor, setPlayerColor, timeMode, setTimeMode }) {
  const nav = useNavigate();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const startupRef = useRef(null);

  useEffect(() => () => startupRef.current?.abort(), []);

  const [previewWidth, setPreviewWidth] = useState(() => Math.min(640, Math.floor(window.innerWidth * 0.62)));

  useEffect(() => {
    const onResize = () => setPreviewWidth(Math.min(640, Math.floor(window.innerWidth * 0.62)));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function start(color) {
    if (startupRef.current) return;
    const controller = new AbortController();
    startupRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 120000);
    setStarting(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/`, {
        signal: controller.signal,
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Engine unavailable");
      const health = await response.json();
      if (health.status !== "running") throw new Error("Engine unavailable");
      if (controller.signal.aborted) return;
      setPlayerColor(color);
      nav("/play");
    } catch {
      setError("The engine could not start. Try your side again to reconnect.");
    } finally {
      clearTimeout(timeout);
      startupRef.current = null;
      setStarting(false);
    }
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
                  disabled={starting}
                  aria-pressed={timeMode === "rapid"}
                >
                  10 min (Rapid)
                </button>

                <button
                  type="button"
                  className={`landingBegin sideBtnWide ${timeMode === "bullet" ? "active" : ""}`}
                  onClick={() => setTimeMode("bullet")}
                  disabled={starting}
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
                  disabled={starting}
                  aria-pressed={playerColor === "w"}
                >
                  Play White
                </button>

                <button
                  type="button"
                  className={`landingBegin sideBtnWide ${playerColor === "b" ? "active" : ""}`}
                  onClick={() => start("b")}
                  disabled={starting}
                  aria-pressed={playerColor === "b"}
                >
                  Play Black
                </button>
              </div>

              {starting && (
                <p className="text" role="status">
                  Starting the engine… The first game after a break can take a minute. Your clock has not started.
                </p>
              )}
              {error && <p className="text" role="alert">{error}</p>}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
