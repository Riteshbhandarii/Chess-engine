import { useNavigate } from "react-router-dom";

export default function HowToPlay() {
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
