import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Generic.css"; // or Generic.css (whatever you named it)
import "./SignIn.css";


export default function SignIn({ playerName, setPlayerName }) {
  const nav = useNavigate();
  const [name, setName] = useState(playerName || "");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    const v = name.trim();
    if (v.length < 2 || v.length > 20) {
      setError("Username must be 2 to 20 characters.");
      return;
    }
    setPlayerName(v);
    nav("/side");
  }

  return (
    <div
      className="signin"
      style={{
        "--landingBg": `url(${process.env.PUBLIC_URL}/honore-daumier-032.jpg)`,
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
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="  No personal info Needed.."
            autoComplete="username"
            maxLength={20}
          />

          <div className="signinHint">This name will be shown on the leaderboard.</div>

          {error && (
            <div className="signinError" role="alert">
              {error}
            </div>
          )}

          <button className="landingBegin" type="submit">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
