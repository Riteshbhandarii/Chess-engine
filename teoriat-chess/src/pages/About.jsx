import { useNavigate } from "react-router-dom";
import "./About.css";

const GITHUB_URL = "https://github.com/Riteshbhandarii";
const LINKEDIN_URL = "https://www.linkedin.com/in/ritesh-bhandari-0371b5294";

export default function About() {
  const nav = useNavigate();

  return (
    <div
      className="aboutPage"
      style={{
        backgroundImage: `linear-gradient(
          to right,
          rgba(0,0,0,0.88) 0%,
          rgba(0,0,0,0.78) 45%,
          rgba(0,0,0,0.58) 70%,
          rgba(0,0,0,0.35) 100%
        ), url(${process.env.PUBLIC_URL}/menupages.jpg)`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "85% center",
      }}
    >
      <button className="linkBtn aboutBack" type="button" onClick={() => nav(-1)}>
        Back
      </button>

      <div className="aboutContent">
        <h2 className="aboutTitle">About</h2>

        <div className="aboutBlocks">
          <p className="aboutBlock aboutLead">
            I am a chess enthusiast who spent a long time looking for a project that genuinely felt
            exciting to build.
          </p>

          <p className="aboutBlock">
            After countless games on chess.com, one question kept coming back. What if I could build
            a chess engine that plays exactly like me?
          </p>

          <p className="aboutBlock">
            That curiosity became TEORIAT, a personal chess engine designed to reflect my own playing
            style. Instead of aiming for perfect chess, it focuses on how I actually play. The
            openings I gravitate toward. The patterns I repeat. And, hopefully, fewer obvious
            blunders over time. What began as a simple experiment to see if this was even possible
            turned into a full journey of building an engine, integrating it into an application,
            and shaping it into something others can experience.
          </p>

          <p className="aboutBlock">
            Now anyone can put it to the test. Play against my bot and see if you can beat “me” on a
            good day. If you win, congratulations. Either you outplayed it, or you just helped
            uncover the next weakness to fix.
          </p>

          <p className="aboutBlock">
            I am also a final year Data and AI Engineering student, and this project sits at the
            intersection of everything I enjoy. Building systems end to end. Experimenting. And
            learning by shipping.
          </p>

          <p className="aboutBlock">
            Want to connect? Curious about the engine or how it is built? Click the buttons below to
            find me on LinkedIn or dive into the code on GitHub.
          </p>

          {/* GitHub + LinkedIn buttons */}
          <div className="aboutCtas">
            <a
              className="Btn Btn--github"
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub"
              title="GitHub"
            >
              <span className="sign" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 .5C5.73.5.75 5.64.75 12.02c0 5.11 3.29 9.44 7.86 10.97.57.11.78-.25.78-.56 0-.28-.01-1.02-.02-2-3.2.71-3.88-1.58-3.88-1.58-.52-1.36-1.28-1.72-1.28-1.72-1.04-.73.08-.72.08-.72 1.15.08 1.76 1.21 1.76 1.21 1.02 1.78 2.68 1.27 3.33.97.1-.76.4-1.27.73-1.56-2.55-.3-5.23-1.31-5.23-5.83 0-1.29.44-2.35 1.17-3.18-.12-.3-.51-1.52.11-3.17 0 0 .96-.31 3.14 1.22a10.6 10.6 0 0 1 2.86-.4c.97 0 1.94.14 2.86.4 2.18-1.53 3.14-1.22 3.14-1.22.62 1.65.23 2.87.11 3.17.73.83 1.17 1.89 1.17 3.18 0 4.53-2.69 5.52-5.25 5.82.41.37.78 1.09.78 2.2 0 1.59-.01 2.87-.01 3.26 0 .31.2.68.79.56 4.56-1.54 7.84-5.86 7.84-10.97C23.25 5.64 18.27.5 12 .5z" />
                </svg>
              </span>
              <span className="text">GitHub</span>
            </a>

            <a
              className="Btn Btn--linkedin"
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open LinkedIn"
              title="LinkedIn"
            >
              <span className="sign" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.94 6.5A2.22 2.22 0 1 1 6.94 2a2.22 2.22 0 0 1 0 4.5ZM4.75 22h4.38V8.25H4.75V22ZM13.1 8.25H9.36V22h4.38v-7.2c0-1.9.36-3.75 2.7-3.75 2.3 0 2.33 2.15 2.33 3.87V22H23v-7.96c0-3.91-.84-6.91-5.41-6.91-2.2 0-3.67 1.2-4.27 2.34h-.22V8.25Z" />
                </svg>
              </span>
              <span className="text">LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
