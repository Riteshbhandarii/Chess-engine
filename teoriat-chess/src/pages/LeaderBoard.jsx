import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";
const BG_URL = `${process.env.PUBLIC_URL}/menupages.jpg`;

function BoardTable({ title, rows, loading, error }) {
  return (
    <section className="lbBlock">
      <header className="lbHeader">
        <h2 className="lbTitle">{title}</h2>
      </header>

      {loading && <div className="lbMeta">Loading…</div>}
      {error && <div className="lbError">{error}</div>}

      {!loading && !error && (
        <div className="lbTableWrap">
          <table className="lbTable">
            <thead>
              <tr>
                <th>User</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>Games</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="lbEmpty">
                    No games yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={`${r.player_name}-${r.mode}`}>
                    <td className="lbUser">{r.player_name}</td>
                    <td>{r.wins}</td>
                    <td>{r.losses}</td>
                    <td>{r.draws}</td>
                    <td>{r.games}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function LeaderBoard() {
  const nav = useNavigate();

  const [bulletRows, setBulletRows] = useState([]);
  const [rapidRows, setRapidRows] = useState([]);

  const [loadingBullet, setLoadingBullet] = useState(true);
  const [loadingRapid, setLoadingRapid] = useState(true);

  const [errorBullet, setErrorBullet] = useState("");
  const [errorRapid, setErrorRapid] = useState("");

  async function fetchMode(mode, setRows, setLoading, setError) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/leaderboard?mode=${mode}&limit=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || String(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMode("bullet", setBulletRows, setLoadingBullet, setErrorBullet);
    fetchMode("rapid", setRapidRows, setLoadingRapid, setErrorRapid);
  }, []);

  return (
    <div
      className="lbPage"
      style={{
        backgroundImage:
          `linear-gradient(to right, ` +
          `rgba(0,0,0,0.88) 0%, ` +
          `rgba(0,0,0,0.78) 45%, ` +
          `rgba(0,0,0,0.60) 70%, ` +
          `rgba(0,0,0,0.45) 100%), ` +
          `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "85% center",
      }}
    >
      <button className="lbBack" onClick={() => nav("/")}>
        Back
      </button>

      <main className="lbContent lbTwoCol">
        <BoardTable
          title="Bullet vs TEORIAT"
          rows={bulletRows}
          loading={loadingBullet}
          error={errorBullet}
        />
        <BoardTable
          title="Rapid vs TEORIAT"
          rows={rapidRows}
          loading={loadingRapid}
          error={errorRapid}
        />
      </main>
    </div>
  );
}
