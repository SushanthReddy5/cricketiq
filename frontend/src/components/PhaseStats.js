import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPhaseStats, getPlayers } from '../api';
import PlayerSearch from './PlayerSearch';

const PC = { powerplay: '#00F2FE', middle: '#FFD700', death: '#FF1744' };
const PL = { powerplay: 'Powerplay (Overs 1–6)', middle: 'Middle (Overs 7–15)', death: 'Death (Overs 16–20)' };

export default function PhaseStats() {
  const [players, setPlayers] = useState([]);
  const [player, setPlayer] = useState('');
  const [role, setRole] = useState('batter');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPlayers().then(r => setPlayers(r.data.players || []));
  }, []);

  const submit = async () => {
    if (!player) return;
    setLoading(true);
    setData(null);
    try {
      const r = await getPhaseStats(player, role);
      setData(r.data);
    } catch {}
    setLoading(false);
  };

  const chartData = data ? Object.entries(data.phases).filter(([, v]) => !v.no_data).map(([phase, stats]) => ({
    phase: phase.charAt(0).toUpperCase() + phase.slice(1),
    ...(role === 'batter'
      ? { 'Strike Rate': stats.strike_rate, 'Boundary %': stats.boundary_pct }
      : { 'Economy': stats.economy, 'Dot Ball %': stats.dot_ball_pct }),
  })) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Player and Role selection card */}
      <div className="glass-card stagger-1" style={{ padding: 28 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {['batter', 'bowler'].map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setData(null); }}
              style={{
                padding: '8px 22px', borderRadius: 50, border: '1px solid',
                borderColor: role === r ? '#00F2FE' : 'rgba(255, 255, 255, 0.12)',
                background: role === r ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: role === r ? '#00F2FE' : '#94a3b8',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s'
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div style={{ maxWidth: 440 }}>
          <PlayerSearch players={players} value={player} onChange={setPlayer} label="Player" placeholder={`Search ${role}...`} />
        </div>
        <button className="btn-primary" onClick={submit} disabled={loading || !player} style={{ marginTop: 20 }}>
          {loading ? '⏳ Analyzing Phases...' : '⚡ Analyse Phases'}
        </button>
      </div>

      {data && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(data.phases).map(([phase, stats], idx) => !stats.no_data && (
              <div
                key={phase}
                className="glass-card"
                style={{
                  padding: 22,
                  borderLeft: `4px solid ${PC[phase]}`,
                  animation: `fadeUp 0.5s ${idx * 0.1}s ease both`
                }}
              >
                <div style={{
                  fontWeight: 800, fontSize: 13, textTransform: 'uppercase',
                  color: PC[phase], letterSpacing: '0.08em', marginBottom: 14
                }}>
                  {PL[phase]}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                  {(role === 'batter' ? [
                    { val: stats.runs,          label: 'Runs',       col: '#FFD700' },
                    { val: stats.balls,         label: 'Balls',      col: '#fff'    },
                    { val: stats.strike_rate,   label: 'Strike Rate',col: '#00F2FE' },
                    { val: `${stats.boundary_pct}%`, label: 'Boundary %', col: '#00E676' },
                    { val: `${stats.fours}/${stats.sixes}`, label: '4s/6s', col: '#94a3b8' },
                    { val: stats.dismissals,    label: 'Dismissals', col: '#FF1744' },
                  ] : [
                    { val: stats.runs_conceded, label: 'Runs Conceded', col: '#FF1744' },
                    { val: stats.balls,         label: 'Balls',         col: '#fff'    },
                    { val: stats.wickets,       label: 'Wickets',       col: '#00E676' },
                    { val: stats.economy,       label: 'Economy',       col: '#FFD700' },
                    { val: `${stats.dot_ball_pct}%`, label: 'Dot Ball %', col: '#00F2FE' },
                    { val: stats.strike_rate || 'N/A', label: 'Strike Rate', col: '#94a3b8' },
                  ]).map(s => (
                    <div
                      key={s.label}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10,
                        padding: '12px 10px', textAlign: 'center',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}
                    >
                      <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.col }}>{s.val}</div>
                      <div style={{
                        fontSize: 10, color: '#64748b', marginTop: 4,
                        textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700
                      }}>
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="glass-card stagger-3" style={{ padding: 24 }}>
              <div style={{
                fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.06em', marginBottom: 16
              }}>
                Phase Comparison
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20 }}>
                  <XAxis dataKey="phase" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: '#fff'
                    }}
                  />
                  {role === 'batter' ? (
                    <>
                      <Bar dataKey="Strike Rate" fill="#00F2FE" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Boundary %" fill="#00E676" radius={[6, 6, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Economy" fill="#FF1744" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Dot Ball %" fill="#00F2FE" radius={[6, 6, 0, 0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
