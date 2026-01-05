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
            I’m a chess enthusiast who spent a long time looking for a project that actually felt
            exciting to build. Since I play a lot on chess.com, one question kept coming back: could
            I create a chess engine that plays exactly like me?
          </p>

          <p className="aboutBlock">
            That curiosity turned into TEORIAT — a personal chess engine project built around my own
            style: the plans I tend to choose, the patterns I repeat, and (hopefully) fewer obvious
            blunders. What started as “let’s see if this is even possible” became a full journey
            into building an engine, wiring it into an app, and turning it into something other
            people can actually try.
          </p>

          <p className="aboutBlock">
            Now anyone can test it: play against my bot and see if you can beat “me” on a good day.
            If you win, congrats — either you outplayed it, or you just exposed a new weakness for
            the next iteration.
          </p>

          <p className="aboutBlock">
            I’m also a final-year Data & AI Engineering student, so this project is where chess meets
            everything I like: building systems end-to-end, experimenting, and learning by shipping.
          </p>

          <p className="aboutBlock">
            Want to connect? If you’re up for chatting about chess (or anything dev/ML), feel free
            to reach out on LinkedIn and check my GitHub — buttons for those are coming soon.
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
                <svg viewBox="0 0 24 24">
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
