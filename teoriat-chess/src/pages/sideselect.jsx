import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chessboard } from "react-chessboard";

import "./Generic.css";
import "./SideSelect.css";

export default function SideSelect({ playerName, playerColor, setPlayerColor, timeMode, setTimeMode }) {
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

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
