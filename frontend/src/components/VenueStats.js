import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { getVenues, getVenueStats } from '../api';
import defaultVenues from '../data/venues.json';
import defaultVenueStats from '../data/venue_stats.json';

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card" style={{
      background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 10, padding: '8px 14px', fontSize: 12, color: '#e2e8f0'
    }}>
      <div style={{ fontWeight: 700, color: '#fff' }}>{label}</div>
      <div style={{ color: '#00F2FE', marginTop: 2 }}>{payload[0]?.value} wickets</div>
    </div>
  );
};

export default function VenueStats() {
  const [venues, setVenues] = useState(defaultVenues);
  const [venue, setVenue] = useState(defaultVenues[0] || '');
  const [data, setData] = useState(defaultVenueStats[defaultVenues[0]] || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVenues().then(r => {
      const vList = r.data?.venues || [];
      if (vList.length > 0) {
        setVenues(vList);
      }
    }).catch(() => {});
  }, []);

  const load = async v => {
    setVenue(v);
    if (!v) return;
    setLoading(true);
    try {
      const r = await getVenueStats(v);
      if (r.data && !r.data.error) {
        setData(r.data);
      } else {
        setData(defaultVenueStats[v] || null);
      }
    } catch {
      setData(defaultVenueStats[v] || null);
    }
    setLoading(false);
  };

  const phaseData = data ? [
    { name: 'Powerplay', wickets: data.wickets_by_phase?.powerplay, fill: '#00F2FE' },
    { name: 'Middle',    wickets: data.wickets_by_phase?.middle,   fill: '#FFD700' },
    { name: 'Death',     wickets: data.wickets_by_phase?.death,    fill: '#FF1744' },
  ] : [];

  const pieData = data ? [
    { name: 'Bat First Wins', value: data.bat_first_win_pct, fill: '#00F2FE' },
    { name: 'Chase Wins',     value: data.chase_win_pct,     fill: '#00E676' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Venue selector card */}
      <div className="glass-card stagger-1" style={{ padding: 24 }}>
        <div style={{
          fontSize: 10, color: '#64748b', textTransform: 'uppercase',
          letterSpacing: '0.1em', marginBottom: 8, fontWeight: 700
        }}>
          Select Venue
        </div>
        <select
          className="inp"
          style={{ maxWidth: 480 }}
          value={venue}
          onChange={e => load(e.target.value)}
        >
          <option value="">Choose a venue...</option>
          {venues.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {loading && (
        <div style={{
          textAlign: 'center', padding: 48, color: '#64748b',
          fontSize: 14, letterSpacing: '0.08em'
        }}>
          ⏳ Loading venue intelligence...
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
              { val: data.total_matches,          label: 'Total Matches',    col: '#fff' },
              { val: data.avg_first_innings_total, label: 'Avg 1st Innings',  col: '#FFD700' },
              { val: `${data.bat_first_win_pct}%`, label: 'Bat 1st Win Rate', col: '#00F2FE' },
              { val: `${data.chase_win_pct}%`,     label: 'Chase Win Rate',   col: '#00E676' },
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
            {/* Wickets by phase */}
            <div className="glass-card stagger-3" style={{ padding: 24 }}>
              <div style={{
                fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.06em', marginBottom: 16
              }}>
                Wickets by Phase
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={phaseData} margin={{ top: 20, right: 10, left: -20 }}>
                  <XAxis dataKey="name" stroke="#334155" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="wickets" radius={[6, 6, 0, 0]}>
                    {phaseData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bat first vs chase */}
            <div className="glass-card stagger-4" style={{ padding: 24 }}>
              <div style={{
                fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.06em', marginBottom: 16
              }}>
                Defend vs Chase Win Rate
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
          </div>
        </>
      )}
    </div>
  );
}
