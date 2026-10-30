import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { predictWinner, getVenues, getSeasons, getTeams } from '../api';
import defaultVenues from '../data/venues.json';
import defaultSeasons from '../data/seasons.json';

const TEAMS = [
  'Chennai Super Kings','Mumbai Indians','Royal Challengers Bengaluru',
  'Kolkata Knight Riders','Sunrisers Hyderabad','Delhi Capitals',
  'Punjab Kings','Rajasthan Royals','Gujarat Titans','Lucknow Super Giants'
];

function FormDots({ results }) {
  if (!results?.length) return <span style={{color:'#334155',fontSize:12}}>No data</span>;
  return (
    <div style={{display:'flex',gap:5,alignItems:'center'}}>
      {results.map((w,i) => (
        <div key={i} className={w ? 'form-dot-win' : 'form-dot-loss'}
          style={{width:11,height:11,borderRadius:'50%',transition:'transform 0.2s',cursor:'default'}}
          title={w?'Win':'Loss'}
        />
      ))}
    </div>
  );
}

function CompareRow({ label, v1, v2, lowerIsBetter=false }) {
  const n1 = parseFloat(v1), n2 = parseFloat(v2);
  const t1B = lowerIsBetter ? n1 < n2 : n1 > n2;
  const t2B = lowerIsBetter ? n2 < n1 : n2 > n1;
  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr 120px 1fr',alignItems:'center',gap:8,padding:'9px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
      <div style={{textAlign:'right',fontSize:15,fontWeight:700,color:t1B?'#00E676':t2B?'#FF1744':'#94a3b8'}}>{v1}</div>
      <div style={{textAlign:'center',fontSize:10,color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</div>
      <div style={{textAlign:'left',fontSize:15,fontWeight:700,color:t2B?'#00E676':t1B?'#FF1744':'#94a3b8'}}>{v2}</div>
    </div>
  );
}

const TooltipCustom = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return <div className="glass-card" style={{padding:'8px 12px',fontSize:12}}>
    <div style={{color:'#fff',fontWeight:600}}>{label}</div>
    <div style={{color:'#00F2FE'}}>{payload[0]?.value?.toFixed(1)}%</div>
  </div>;
};

export default function Prediction() {
  const [teamList, setTeamList] = useState(TEAMS);
  const [venues,  setVenues]  = useState(defaultVenues);
  const [seasons, setSeasons] = useState(defaultSeasons);
  const [form, setForm] = useState({
    team1: TEAMS[0] || '',
    team2: TEAMS[1] || '',
    venue: defaultVenues[0] || '',
    season: defaultSeasons[0] || '2026'
  });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    getTeams().then(r => {
      if (r.data?.current_teams?.length) setTeamList(r.data.current_teams);
    }).catch(() => {});
    getVenues().then(r => {
      if (r.data?.venues?.length) setVenues(r.data.venues);
    }).catch(()=>{});
    getSeasons().then(r => {
      const s = r.data?.seasons;
      if (s?.length) {
        setSeasons(s);
        setForm(f => ({ ...f, season: f.season || s[0] || '2026' }));
      }
    }).catch(()=>{});
  }, []);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const submit = async () => {
    if (!form.team1||!form.team2||!form.venue) { setError('Please fill all fields'); return; }
    if (form.team1===form.team2) { setError('Teams must be different'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const r = await predictWinner({team1:form.team1,team2:form.team2,venue:form.venue,season:form.season});
      setResult(r.data);
      setAnimKey(k=>k+1);
    } catch {
      setError('Prediction failed — ensure backend is running or waking up (Render free tier wakes in ~30s). Please try again shortly.');
    }
    setLoading(false);
  };

  const bd = result?.breakdown;
  const impData = result ? [
    {name:'Squad Strength', value:+((result.group_importances?.F4_Squad_Strength||0.511)*100).toFixed(1), color:'#00E676'},
    {name:'Venue & Pitch',  value:+((result.group_importances?.F3_Venue_Pitch   ||0.290)*100).toFixed(1), color:'#00F2FE'},
    {name:'Team Form',      value:+((result.group_importances?.F1_Team_Form     ||0.138)*100).toFixed(1), color:'#FFD700'},
    {name:'H2H',            value:+((result.group_importances?.F2_H2H           ||0.061)*100).toFixed(1), color:'#FF1744'},
  ] : [];

  const inputStyle = {
    width:'100%', background:'rgba(15,23,42,0.8)', border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:12, padding:'11px 14px', fontSize:13, color:'#e2e8f0',
    outline:'none', transition:'border-color 0.2s', cursor:'pointer',
  };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}}>

      {/* Input card */}
      <div className="glass-card" style={{padding:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
          <h3 style={{fontSize:17,fontWeight:800,color:'#fff',margin:0}}>Match Setup</h3>
          {result && <div className="glass-card" style={{padding:'6px 14px',fontSize:12,color:'#64748b'}}>
            CV Accuracy <span style={{color:'#00F2FE',fontWeight:700}}>{result.model_accuracy}%</span>
          </div>}
        </div>

        {/* Season pills */}
        <div style={{marginBottom:18}}>
          <div style={{fontSize:10,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Season</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {seasons.map(s => (
              <button key={s} onClick={()=>set('season',s)} style={{
                padding:'5px 13px', borderRadius:50, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all 0.15s', border:'1px solid',
                borderColor: form.season===s ? 'rgba(0,242,254,0.5)' : 'rgba(255,255,255,0.1)',
                background:  form.season===s ? 'rgba(0,242,254,0.12)' : 'transparent',
                color:       form.season===s ? '#00F2FE' : '#475569',
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
          {[{label:'Team 1',key:'team1',opts:teamList},{label:'Team 2',key:'team2',opts:teamList},{label:'Venue',key:'venue',opts:venues}].map(f=>(
            <div key={f.key}>
              <div style={{fontSize:10,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:6}}>{f.label}</div>
              <select value={form[f.key]} onChange={e=>set(f.key,e.target.value)} style={inputStyle}>
                <option value="">Select {f.label}...</option>
                {f.opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

        </div>

        {error && <div style={{marginTop:14,padding:'10px 16px',borderRadius:10,background:'rgba(255,23,68,0.1)',border:'1px solid rgba(255,23,68,0.25)',color:'#FF1744',fontSize:13}}>{error}</div>}

        <button onClick={submit} disabled={loading} style={{
          marginTop:18, padding:'12px 32px', borderRadius:50, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#00F2FE,#00E676)', color:'#0B0F19', fontWeight:800, fontSize:14,
          opacity:loading?0.5:1, transition:'all 0.2s', boxShadow:'0 0 20px rgba(0,242,254,0.25)',
        }}>
          {loading ? '⏳ Analysing...' : '⚡ Predict Winner'}
        </button>
      </div>

      {/* Results */}
      {result && bd && (
        <div key={animKey} style={{display:'flex',flexDirection:'column',gap:18}}>

          {/* Winner */}
          <div className="glass-card stagger-1" style={{
            padding:28, textAlign:'center', borderColor:'rgba(0,230,118,0.25)',
            background:'linear-gradient(135deg,rgba(0,230,118,0.06),rgba(0,242,254,0.04))',
          }}>
            {result.is_offline && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 50,
                  background: 'rgba(255, 215, 0, 0.12)', border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: '#FFD700'
                }}>
                  ⚡ Instant 4-Factor Model (Offline Mode)
                </span>
              </div>
            )}
            <div style={{fontSize:12,color:'#64748b',letterSpacing:'0.08em',marginBottom:8}}>Season {result.season} · {result.confidence}% confidence</div>
            <div style={{fontSize:36,fontWeight:900,color:'#fff',marginBottom:4}}>🏆 {result.predicted_winner}</div>
            <div style={{fontSize:13,color:'#64748b'}}>Predicted Winner</div>
            {/* Prob bar */}
            <div style={{marginTop:20}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:700,marginBottom:8}}>
                <span style={{color:'#00F2FE'}}>{result.team1} — {result.team1_win_probability}%</span>
                <span style={{color:'#FFD700'}}>{result.team2_win_probability}% — {result.team2}</span>
              </div>
              <div style={{height:12,borderRadius:6,background:'rgba(255,255,255,0.06)',overflow:'hidden',display:'flex'}}>
                <div className="prob-fill" style={{height:'100%',background:'linear-gradient(90deg,#00F2FE,#3b82f6)',width:`${result.team1_win_probability}%`}}/>
                <div className="prob-fill" style={{height:'100%',background:'linear-gradient(90deg,#d97706,#FFD700)',width:`${result.team2_win_probability}%`}}/>
              </div>
            </div>
          </div>

          {/* Model weights chart */}
          <div className="glass-card stagger-2" style={{padding:20}}>
            <div style={{fontSize:11,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:14}}>Model Factor Weights</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={impData} layout="vertical" margin={{left:0,right:24}}>
                <XAxis type="number" stroke="#1e293b" tick={{fill:'#475569',fontSize:10}} tickFormatter={v=>`${v}%`}/>
                <YAxis type="category" dataKey="name" stroke="#1e293b" tick={{fill:'#64748b',fontSize:10}} width={110}/>
                <Tooltip content={<TooltipCustom/>}/>
                <Bar dataKey="value" radius={[0,6,6,0]}>
                  {impData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 4-factor grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>

            {/* Form */}
            <div className="glass-card stagger-3" style={{padding:18,borderLeft:'3px solid #FFD700'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>📈 Team Form</span>
                <span style={{fontSize:10,color:'#FFD700',background:'rgba(255,215,0,0.1)',border:'1px solid rgba(255,215,0,0.2)',padding:'3px 10px',borderRadius:50}}>
                  {bd.team_form?.weight||13.8}% weight
                </span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,marginBottom:12}}>
                <div style={{textAlign:'right',fontSize:11,color:'#00F2FE',fontWeight:700}}>{result.team1}</div>
                <div style={{fontSize:10,color:'#1e293b'}}>vs</div>
                <div style={{textAlign:'left',fontSize:11,color:'#FFD700',fontWeight:700}}>{result.team2}</div>
              </div>
              <CompareRow
                label="W / Last 5"
                v1={`${bd.team_form?.team1?.wins??'?'}/${bd.team_form?.team1?.total??'?'}`}
                v2={`${bd.team_form?.team2?.wins??'?'}/${bd.team_form?.team2?.total??'?'}`}
              />
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,marginTop:10}}>
                <div style={{display:'flex',justifyContent:'flex-end'}}><FormDots results={bd.team_form?.team1?.results}/></div>
                <div style={{fontSize:10,color:'#1e293b',textAlign:'center'}}>W/L</div>
                <div><FormDots results={bd.team_form?.team2?.results}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
                {[{t:result.team1,s:bd.team_form?.team1?.streak,c:'#00F2FE'},{t:result.team2,s:bd.team_form?.team2?.streak,c:'#FFD700'}].map(({t,s,c})=>(
                  <div key={t} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'8px 12px',textAlign:'center'}}>
                    <div style={{fontSize:16,fontWeight:800,color:s>0?'#00E676':s<0?'#FF1744':'#475569'}}>
                      {s>0?`W${s}`:s<0?`L${Math.abs(s)}`:'—'}
                    </div>
                    <div style={{fontSize:10,color:c,marginTop:3}}>{t.split(' ').pop()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* H2H */}
            <div className="glass-card stagger-3" style={{padding:18,borderLeft:'3px solid #8b5cf6'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>⚔️ Head to Head</span>
                <span style={{fontSize:10,color:'#8b5cf6',background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)',padding:'3px 10px',borderRadius:50}}>
                  {bd.head_to_head?.weight||6.1}% weight
                </span>
              </div>
              <div style={{display:'flex',justifyContent:'space-around',alignItems:'center',background:'rgba(255,255,255,0.03)',borderRadius:14,padding:'20px 10px',marginBottom:10}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:48,fontWeight:900,color:'#00F2FE',lineHeight:1}}>{bd.head_to_head?.t1_wins??'—'}</div>
                  <div style={{fontSize:10,color:'#334155',marginTop:6}}>{result.team1}</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:12,color:'#1e293b',fontWeight:600}}>of {bd.head_to_head?.total??0}</div>
                  <div style={{fontSize:10,color:'#0f172a',marginTop:2}}>matches</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:48,fontWeight:900,color:'#FFD700',lineHeight:1}}>{bd.head_to_head?.t2_wins??'—'}</div>
                  <div style={{fontSize:10,color:'#334155',marginTop:6}}>{result.team2}</div>
                </div>
              </div>
              <div style={{fontSize:10,color:'#1e293b',textAlign:'center'}}>Recent 2 years weighted 2×</div>
            </div>

            {/* Venue */}
            <div className="glass-card stagger-4" style={{padding:18,borderLeft:'3px solid #00F2FE'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>🏟️ Venue & Pitch</span>
                <span style={{fontSize:10,color:'#00F2FE',background:'rgba(0,242,254,0.1)',border:'1px solid rgba(0,242,254,0.2)',padding:'3px 10px',borderRadius:50}}>
                  {bd.venue_pitch?.weight||29.0}% weight
                </span>
              </div>
              <CompareRow label="Venue Win %" v1={`${bd.venue_pitch?.team1_venue_rate??50}%`} v2={`${bd.venue_pitch?.team2_venue_rate??50}%`}/>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:12}}>
                {[
                  {label:'Avg 1st Inn',    val:Math.round(bd.venue_pitch?.avg_inn1??160)},
                  {label:'Chase Win %',    val:`${Math.round((bd.venue_pitch?.venue_chase_rate??0.5)*100)}%`},
                  {label:'Bat-First Win%', val:`${Math.round((bd.venue_pitch?.toss_bat_win_rate??0.5)*100)}%`},
                  {label:'Pitch Type',     val:(bd.venue_pitch?.spin_index??0.5)>=0.55?'🔄 Spin':(bd.venue_pitch?.spin_index??0.5)<=0.45?'💨 Pace':'⚖️ Balanced'},
                ].map(s=>(
                  <div key={s.label} style={{background:'rgba(255,255,255,0.03)',borderRadius:10,padding:'10px',textAlign:'center'}}>
                    <div style={{fontSize:15,fontWeight:700,color:'#e2e8f0'}}>{s.val}</div>
                    <div style={{fontSize:10,color:'#334155',marginTop:3}}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Squad */}
            <div className="glass-card stagger-4" style={{padding:18,borderLeft:'3px solid #00E676'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                <span style={{fontSize:13,fontWeight:700,color:'#fff'}}>💪 Squad Strength</span>
                <span style={{fontSize:10,color:'#00E676',background:'rgba(0,230,118,0.1)',border:'1px solid rgba(0,230,118,0.2)',padding:'3px 10px',borderRadius:50}}>
                  {bd.squad_strength?.weight||51.1}% weight
                </span>
              </div>
              <CompareRow label="Batting SR"   v1={bd.squad_strength?.team1?.batting_sr}    v2={bd.squad_strength?.team2?.batting_sr}/>
              <CompareRow label="Boundary %"   v1={`${bd.squad_strength?.team1?.boundary_pct}%`} v2={`${bd.squad_strength?.team2?.boundary_pct}%`}/>
              <CompareRow label="Bowl Economy" v1={bd.squad_strength?.team1?.bowling_economy} v2={bd.squad_strength?.team2?.bowling_economy} lowerIsBetter={true}/>
              <CompareRow label="Dot Ball %"   v1={`${bd.squad_strength?.team1?.dot_pct}%`}  v2={`${bd.squad_strength?.team2?.dot_pct}%`}/>
              {bd.squad_strength?.team1?.top_batters?.length > 0 && (
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
                  {[{t:result.team1,d:bd.squad_strength.team1,c:'#00F2FE'},{t:result.team2,d:bd.squad_strength.team2,c:'#FFD700'}].map(({t,d,c})=>(
                    <div key={t}>
                      <div style={{fontSize:10,fontWeight:700,color:c,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6}}>
                        {t.split(' ').slice(-2).join(' ')}
                      </div>
                      {d.top_batters?.slice(0,3).map(b=>(
                        <div key={b.name} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:11}}>
                          <span style={{color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:6}}>{b.name}</span>
                          <span style={{fontWeight:700,flexShrink:0,color:b.sr>=140?'#00E676':b.sr>=120?'#FFD700':'#FF1744'}}>SR {b.sr}</span>
                        </div>
                      ))}
                      <div style={{height:8}}/>
                      {d.top_bowlers?.slice(0,2).map(b=>(
                        <div key={b.name} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:11}}>
                          <span style={{color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginRight:6}}>{b.name}</span>
                          <span style={{fontWeight:700,flexShrink:0,color:b.economy<=7.5?'#00E676':b.economy<=9?'#FFD700':'#FF1744'}}>Eco {b.economy}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
