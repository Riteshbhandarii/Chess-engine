import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

function Table({ title, rows, loading, error }) {
  return (
    <div className="lbBlock">
      <div className="lbBlockHeader">
        <h2 className="lbTitle">{title}</h2>
      </div>

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
    </div>
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
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMode("bullet", setBulletRows, setLoadingBullet, setErrorBullet);
    fetchMode("rapid", setRapidRows, setLoadingRapid, setErrorRapid);
  }, []);

  const bulletSorted = useMemo(() => bulletRows, [bulletRows]);
  const rapidSorted = useMemo(() => rapidRows, [rapidRows]);

  return (
    <div className="lbPage">
      <button className="lbBack" onClick={() => nav("/")}>
        Back
      </button>

      <div className="lbContent">
        <Table
          title="Bullet vs TEORIAT"
          rows={bulletSorted}
          loading={loadingBullet}
          error={errorBullet}
        />
        <Table
          title="Rapid vs TEORIAT"
          rows={rapidSorted}
          loading={loadingRapid}
          error={errorRapid}
        />
      </div>
    </div>
  );
}
