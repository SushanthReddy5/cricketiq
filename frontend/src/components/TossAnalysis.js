import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { getTossAnalysis, getVenues } from '../api';
import defaultVenues from '../data/venues.json';
import defaultTossStats from '../data/toss_stats.json';

export default function TossAnalysis() {
  const [venues, setVenues] = useState(defaultVenues);
  const [venue, setVenue] = useState('all');
  const [data, setData] = useState(defaultTossStats['all'] || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVenues().then(r => {
      if (r.data?.venues?.length) setVenues(r.data.venues);
    }).catch(() => {});
    load('all');
  }, []);

  const load = async v => {
    setVenue(v);
    setLoading(true);
    try {
      const r = await getTossAnalysis(v);
      if (r.data && !r.data.error) {
        setData(r.data);
      } else {
        setData(defaultTossStats[v] || defaultTossStats['all']);
      }
    } catch {
      setData(defaultTossStats[v] || defaultTossStats['all']);
    }
    setLoading(false);
  };

  const pieData = data ? [
    { name: 'Toss Winner Won Match',  value: data.toss_winner_win_pct,  fill: '#00F2FE' },
    { name: 'Toss Winner Lost Match', value: data.toss_winner_loss_pct, fill: '#FF1744' },
  ] : [];

  const barData = data ? [
    { name: 'Chose to Bat',   win_pct: data.bat_first?.win_pct,   fill: '#FFD700' },
    { name: 'Chose to Field', win_pct: data.field_first?.win_pct, fill: '#00E676' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Venue Selector */}
      <div className="glass-card stagger-1" style={{ padding: 24 }}>
        <div style={{
          fontSize: 10, color: '#64748b', textTransform: 'uppercase',
          letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700
        }}>
          Filter by Venue
        </div>
        <select
          className="inp"
          style={{ maxWidth: 480 }}
          value={venue}
          onChange={e => load(e.target.value)}
        >
          <option value="all">All Venues (1,210 Matches)</option>
          {venues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {loading && (
        <div style={{
          textAlign: 'center', padding: 48, color: '#64748b',
          fontSize: 14, letterSpacing: '0.08em'
        }}>
          ⏳ Analyzing toss outcomes...
        </div>
      )}

      {data && !data.error && (
        <>
          {/* Key Metric cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 16
          }}>
            {[
              { val: data.total_matches,            label: 'Total Matches',       col: '#fff' },
              { val: `${data.toss_winner_win_pct}%`, label: 'Toss Winner Win %',  col: '#00F2FE' },
              { val: data.bat_first?.count,          label: 'Chose to Bat',       col: '#FFD700' },
              { val: data.field_first?.count,        label: 'Chose to Field',     col: '#00E676' },
            ].map((s, idx) => (
              <div key={s.label} className={`glass-card stagger-${idx + 1}`} style={{ padding: '22px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.col }}>{s.val}</div>
                <div style={{
                  fontSize: 11, color: '#64748b', marginTop: 6,
                  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div className="glass-card stagger-3" style={{ padding: 24 }}>
              <div style={{
                fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.06em', marginBottom: 16
              }}>
                Toss Winner Outcome
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    innerRadius={44}
                    label={({ cx, cy, midAngle, outerRadius, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 20;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#e2e8f0"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={700}
                        >
                          {`${value}%`}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: 10,
                      fontSize: 12,
                      color: '#fff'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card stagger-4" style={{ padding: 24 }}>
              <div style={{
                fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.06em', marginBottom: 16
              }}>
                Decision Win Rate (Bat vs Field)
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={barData} margin={{ top: 20, right: 10, left: -20 }}>
                  <XAxis dataKey="name" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 12 }} />
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
                  <Bar dataKey="win_pct" radius={[6, 6, 0, 0]}>
                    {barData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
