import React, { useState, useEffect } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { getMatchup, getPlayers } from '../api';
import PlayerSearch from './PlayerSearch';
import defaultPlayers from '../data/players.json';

export default function Matchup() {
  const [players, setPlayers] = useState(defaultPlayers);
  const [batter, setBatter] = useState('');
  const [bowler, setBowler] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPlayers().then(r => {
      if (r.data?.players?.length) setPlayers(r.data.players);
    }).catch(() => {});
  }, []);

  const submit = async () => {
    if (!batter || !bowler) { setError('Please select both a batter and a bowler'); return; }
    setError('');
    setLoading(true);
    try {
      const r = await getMatchup(batter, bowler);
      setData(r.data);
    } catch {
      setError('Failed to fetch matchup data — ensure backend is running or waking up.');
    }
    setLoading(false);
  };

  const radarData = data && !data.error ? [
    { metric: 'Strike Rate',  value: Math.min(data.strike_rate, 200) },
    { metric: 'Boundary %',   value: data.boundary_pct * 2 },
    { metric: 'Dot Ball %',   value: data.dot_ball_pct },
    { metric: 'Dismissals',   value: Math.min(data.dismissals * 20, 100) },
    { metric: 'Balls Faced',  value: Math.min(data.balls_faced, 100) },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Player Selection Card */}
      <div className="glass-card stagger-1" style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
          <PlayerSearch players={players} value={batter} onChange={setBatter} label="Batter" placeholder="Search batter (e.g. V Kohli)..." />
          <PlayerSearch players={players} value={bowler} onChange={setBowler} label="Bowler" placeholder="Search bowler (e.g. JJ Bumrah)..." />
        </div>
        {error && (
          <div style={{
            padding: '10px 16px', background: 'rgba(255, 23, 68, 0.1)',
            border: '1px solid rgba(255, 23, 68, 0.25)', borderRadius: 10,
            color: '#FF1744', fontSize: 13, marginBottom: 16
          }}>
            {error}
          </div>
        )}
        <button className="btn-primary" onClick={submit} disabled={loading || !batter || !bowler}>
          {loading ? '⏳ Loading Duel...' : '⚡ Analyse Matchup'}
        </button>
      </div>

      {data && !data.error && (
        <>
          {/* Duel Header */}
          <div className="glass-card stagger-2" style={{
            padding: 24, textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(0,242,254,0.05))',
            borderColor: 'rgba(139,92,246,0.3)'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
              {data.batter} <span style={{ color: '#00F2FE' }}>vs</span> {data.bowler}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {data.balls_faced} balls faced across IPL history
            </div>
          </div>

          {/* Metric Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
            {[
              { val: data.runs_scored,         label: 'Runs',       col: '#FFD700' },
              { val: data.balls_faced,         label: 'Balls',      col: '#fff'    },
              { val: data.strike_rate,         label: 'Strike Rate',col: '#00F2FE' },
              { val: data.dismissals,          label: 'Dismissals', col: '#FF1744' },
              { val: data.fours,               label: 'Fours',      col: '#00E676' },
              { val: data.sixes,               label: 'Sixes',      col: '#FFD700' },
              { val: `${data.dot_ball_pct}%`,  label: 'Dot Ball %', col: '#94a3b8' },
              { val: `${data.boundary_pct}%`,  label: 'Boundary %', col: '#00E676' },
            ].map((s, idx) => (
              <div key={s.label} className={`glass-card stagger-${(idx % 4) + 1}`} style={{ padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.col }}>{s.val}</div>
                <div style={{
                  fontSize: 10, color: '#64748b', marginTop: 4,
                  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          <div className="glass-card stagger-3" style={{ padding: 24 }}>
            <div style={{
              fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
              color: '#fff', letterSpacing: '0.06em', marginBottom: 16
            }}>
              Tactical Duel Profile
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    fontSize: 12,
                    color: '#fff'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {data?.error && (
        <div className="glass-card" style={{
          padding: '16px 20px', borderColor: 'rgba(255, 23, 68, 0.3)',
          background: 'rgba(255, 23, 68, 0.08)', color: '#FF1744', fontSize: 14
        }}>
          {data.error}
        </div>
      )}
    </div>
  );
}
