import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import { getWinProb, calculateLocalWinProb } from '../api';

export default function WinProb() {
  const [form, setForm] = useState({ target: '180', current_score: '80', wickets_fallen: '2', overs_completed: '10.0' });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => {
    if (k === 'overs_completed') {
      if (v === '' || /^\d*\.?\d?$/.test(v)) setForm(f => ({ ...f, [k]: v }));
    } else {
      if (v === '' || /^\d+$/.test(v)) setForm(f => ({ ...f, [k]: v }));
    }
  };

  const toInt = v => parseInt(v) || 0;
  const toFlt = v => parseFloat(v) || 0;

  const submit = async () => {
    setError('');
    const p = {
      target: toInt(form.target),
      current_score: toInt(form.current_score),
      wickets_fallen: toInt(form.wickets_fallen),
      overs_completed: toFlt(form.overs_completed),
    };
    if (p.target <= 0) { setError('Target must be greater than 0'); return; }
    if (p.current_score >= p.target) { setError('Score cannot exceed target (match already won)'); return; }
    if (p.wickets_fallen > 10) { setError('Wickets fallen cannot exceed 10'); return; }
    if (p.overs_completed > 20) { setError('Overs completed cannot exceed 20'); return; }
    setLoading(true);
    try {
      const r = await getWinProb(p);
      const d = r.data || calculateLocalWinProb(p);
      setResult(d);
      setHistory(h => [...h, {
        over: p.overs_completed.toFixed(1),
        batting: d.batting_team_win_prob,
        bowling: d.bowling_team_win_prob,
      }]);
    } catch {
      const d = calculateLocalWinProb(p);
      setResult(d);
      setHistory(h => [...h, {
        over: p.overs_completed.toFixed(1),
        batting: d.batting_team_win_prob,
        bowling: d.bowling_team_win_prob,
      }]);
    }
    setLoading(false);
  };

  const reset = () => {
    setResult(null);
    setHistory([]);
    setForm({ target: '180', current_score: '80', wickets_fallen: '2', overs_completed: '10.0' });
  };

  const probColor = p => p >= 60 ? '#00E676' : p >= 40 ? '#FFD700' : '#FF1744';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Input Card */}
      <div className="glass-card stagger-1" style={{ padding: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Target Score',    key: 'target',          hint: 'e.g. 185' },
            { label: 'Current Score',   key: 'current_score',   hint: 'e.g. 80' },
            { label: 'Wickets Fallen',  key: 'wickets_fallen',  hint: '0–10' },
            { label: 'Overs Completed', key: 'overs_completed', hint: 'e.g. 10.3' },
          ].map(f => (
            <div key={f.key}>
              <div style={{
                fontSize: 10, color: '#64748b', textTransform: 'uppercase',
                letterSpacing: '0.1em', marginBottom: 6, fontWeight: 700
              }}>
                {f.label}
              </div>
              <input
                type="text"
                inputMode="decimal"
                className="inp"
                value={form[f.key]}
                placeholder={f.hint}
                onChange={e => set(f.key, e.target.value)}
                onFocus={e => e.target.select()}
                style={{
                  textAlign: 'center', fontSize: '1.4rem', fontWeight: 800,
                  color: '#fff', background: 'rgba(15, 23, 42, 0.9)'
                }}
              />
            </div>
          ))}
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

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? '⏳ Calculating...' : '⚡ Calculate Probability'}
          </button>
          {history.length > 0 && (
            <button
              onClick={reset}
              style={{
                padding: '12px 24px', borderRadius: 50,
                border: '1px solid rgba(255, 255, 255, 0.15)', background: 'transparent',
                color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {result?.status === 'in_progress' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50,
              background: result.is_fallback ? 'rgba(255, 215, 0, 0.12)' : 'rgba(0, 230, 118, 0.12)',
              border: `1px solid ${result.is_fallback ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 230, 118, 0.3)'}`,
              color: result.is_fallback ? '#FFD700' : '#00E676'
            }}>
              {result.is_fallback ? '⚡ Calibrated Physics Engine' : '🏏 Live Historical Chase Engine'}
            </span>
          </div>

          {/* Win prob dual cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {[
              { label: 'Batting Team (Chasing)', prob: result.batting_team_win_prob },
              { label: 'Bowling Team (Defending)', prob: result.bowling_team_win_prob }
            ].map(({ label, prob }) => (
              <div
                key={label}
                className="glass-card stagger-2"
                style={{
                  padding: 28, textAlign: 'center',
                  borderColor: `${probColor(prob)}44`,
                  background: `radial-gradient(ellipse at 50% 20%, ${probColor(prob)}12 0%, rgba(255,255,255,0.02) 80%)`,
                  boxShadow: `0 8px 32px ${probColor(prob)}22`
                }}
              >
                <div style={{
                  fontSize: 11, color: '#94a3b8', textTransform: 'uppercase',
                  letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700
                }}>
                  {label}
                </div>
                <div style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1, color: probColor(prob) }}>
                  {prob}%
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Win Probability
                </div>
              </div>
            ))}
          </div>

          {/* Situation Breakdown Grid */}
          <div className="glass-card stagger-3" style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
              {[
                { label: 'Runs Needed',  val: result.runs_needed,       col: '#00F2FE' },
                { label: 'Balls Left',   val: result.balls_remaining,   col: '#fff'    },
                { label: 'Wickets Left', val: result.wickets_remaining, col: '#00E676' },
                { label: 'Required RR',  val: result.required_run_rate, col: '#FF1744' },
                { label: 'Current RR',   val: result.current_run_rate,  col: '#FFD700' },
              ].map(s => (
                <div
                  key={s.label}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10,
                    padding: '14px 10px', textAlign: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}
                >
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.col }}>{s.val}</div>
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

          {/* History Chart */}
          {history.length > 1 && (
            <div className="glass-card stagger-4" style={{ padding: 24 }}>
              <div style={{
                fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.06em', marginBottom: 16
              }}>
                Probability Momentum by Over
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={history} margin={{ right: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="over" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: '#fff'
                    }}
                    formatter={v => `${v}%`}
                  />
                  <ReferenceLine y={50} stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="6 3" />
                  <Line type="monotone" dataKey="batting" stroke="#00F2FE" strokeWidth={2.5}
                    dot={{ fill: '#00F2FE', r: 4 }} activeDot={{ r: 7 }} name="Batting Team" animationDuration={600} />
                  <Line type="monotone" dataKey="bowling" stroke="#FFD700" strokeWidth={2.5}
                    dot={{ fill: '#FFD700', r: 4 }} activeDot={{ r: 7 }} name="Bowling Team" animationDuration={600} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12 }}>
                {[
                  { col: '#00F2FE', label: 'Batting Team' },
                  { col: '#FFD700', label: 'Bowling Team' }
                ].map(({ col, label }) => (
                  <span key={label} style={{ color: col, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                    <span style={{ width: 12, height: 3, background: col, display: 'inline-block', borderRadius: 2 }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {result?.status && result.status !== 'in_progress' && (
        <div className="glass-card" style={{
          padding: 40, textAlign: 'center',
          borderColor: result.status === 'batting_team_won' ? 'rgba(0, 230, 118, 0.4)' : 'rgba(0, 242, 254, 0.4)',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
            {result.status === 'batting_team_won' ? '🎉 Batting Team Won!' : '🏆 Bowling Team Won!'}
          </div>
        </div>
      )}
    </div>
  );
}
