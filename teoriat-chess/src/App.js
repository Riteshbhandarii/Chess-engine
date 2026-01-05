import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import "./App.css";

import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import About from "./pages/About";
import LeaderBoard from "./pages/LeaderBoard"; 
import SideSelect from "./pages/sideselect";
import Play from "./pages/Play";

export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [playerColor, setPlayerColor] = useState(null);
  const [timeMode, setTimeMode] = useState("rapid");

  return (
    <Routes>
      <Route path="/" element={<Landing playerName={playerName} setPlayerName={setPlayerName} />} />
      <Route path="/signin" element={<SignIn playerName={playerName} setPlayerName={setPlayerName} />} />

      <Route path="/about" element={<About />} />
      <Route path="/leaderboard" element={<LeaderBoard />} />

      <Route
        path="/side"
        element={
          playerName ? (
            <SideSelect
              playerName={playerName}
              playerColor={playerColor}
              setPlayerColor={setPlayerColor}
              timeMode={timeMode}
              setTimeMode={setTimeMode}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route
        path="/play"
        element={
          playerName && playerColor ? (
            <Play playerName={playerName} playerColor={playerColor} timeMode={timeMode} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}
