import { useState } from "react";
import { useNavigate } from "react-router-dom";



export default function Landing({ playerName, setPlayerName }) {
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