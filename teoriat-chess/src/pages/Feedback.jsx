import { useNavigate } from "react-router-dom";

export default function Feedback() {
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
