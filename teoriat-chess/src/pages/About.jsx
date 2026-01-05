import { useNavigate } from "react-router-dom";
import "./About.css";

export default function About() {
  const nav = useNavigate();

  return (
    <div
      className="aboutPage"
      style={{
        backgroundImage: `
          linear-gradient(
            to top,
            rgba(0,0,0,0.00) 0%,
            rgba(0,0,0,0.15) 35%,
            rgba(0,0,0,0.85) 65%,
            rgba(0,0,0,1.00) 100%
          ),
          url(${process.env.PUBLIC_URL}/menupages.png)
        `,
      }}
    >
      <button
        className="linkBtn aboutBack"
        type="button"
        onClick={() => nav("/")}
        aria-label="Back to home"
      >
        Back
      </button>

      <div className="aboutContent">
        <h2 className="aboutTitle">About</h2>

        <p className="aboutLead">
          I’m a chess enthusiast who spent a long time looking for a project that actually felt exciting to
          build. Since I play a lot on chess.com, one question kept coming back: could I create a chess engine
          that plays exactly like me?
        </p>

        <p className="aboutText">
          That curiosity turned into TEORIAT — a personal chess engine project built around my own style: the
          plans I tend to choose, the patterns I repeat, and (hopefully) fewer obvious blunders. What started
          as “let’s see if this is even possible” became a full journey into building an engine, wiring it into
          an app, and turning it into something other people can actually try.
        </p>

        <p className="aboutText">
          Now anyone can test it: play against my bot and see if you can beat “me” on a good day. If you win,
          congrats — either you outplayed it, or you just exposed a new weakness for the next iteration.
        </p>

        <p className="aboutText">
          I’m also a final-year Data & AI Engineering student, so this project is where chess meets everything
          I like: building systems end-to-end, experimenting, and learning by shipping.
        </p>

        <p className="aboutText">
          Want to connect? If you’re up for chatting about chess (or anything dev/ML), feel free to reach out
          on LinkedIn and check my GitHub — buttons for those are coming soon.
        </p>
      </div>
    </div>
  );
}
