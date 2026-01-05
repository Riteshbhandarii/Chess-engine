import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Generic.css"; // or Generic.css (whatever you named it)
import "./SignIn.css";


export default function SignIn({ playerName, setPlayerName }) {
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
