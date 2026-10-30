import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkBackendHealth, getApiBaseUrl, setApiBaseUrl } from '../api';

const HERO_IMAGES = [
  '/assets/hero-frames/img_01.jpg',
  '/assets/hero-frames/img_15.jpg',
  '/assets/hero-frames/img_10.jpg',
];

const FEATURES = [
  {
    id:      'prediction',
    path:    '/prediction',
    icon:    '🏆',
    title:   'Match Prediction',
    desc:    '4-factor ML model using squad strength, venue history, recent form & head-to-head. Season-aware with zero data leakage.',
    image:   '/assets/hero-frames/img_02.jpg',
    accent:  '#00F2FE',
    tag:     '52.9% CV Accuracy',
  },
  {
    id:      'winprob',
    path:    '/winprob',
    icon:    '📊',
    title:   'Win Probability',
    desc:    'Input live match situation — score, wickets, balls — and get real-time probability powered by historical similarity lookup.',
    image:   '/assets/hero-frames/img_18.jpg',
    accent:  '#00E676',
    tag:     'Live Engine',
  },
  {
    id:      'venue',
    path:    '/venue',
    icon:    '🏟️',
    title:   'Venue Analytics',
    desc:    'Deep dive into 40 IPL venues. 1st innings averages, chase win rates, spin vs pace index and toss decision history.',
    image:   '/assets/hero-frames/img_19.jpg',
    accent:  '#FFD700',
    tag:     '40 Venues',
  },
  {
    id:      'matchup',
    path:    '/matchup',
    icon:    '⚔️',
    title:   'Head to Head',
    desc:    'Every batter vs bowler duel across IPL history. Strike rate, dismissals, boundary %, and tactical radar profile.',
    image:   '/assets/hero-frames/img_20.jpg',
    accent:  '#8b5cf6',
    tag:     '500+ Players',
  },
  {
    id:      'phase',
    path:    '/phase',
    icon:    '📈',
    title:   'Phase Analytics',
    desc:    'Powerplay (1-6), Middle (7-15), Death (16-20) performance split. See where players dominate and where they struggle.',
    image:   '/assets/hero-frames/img_21.jpg',
    accent:  '#f59e0b',
    tag:     '3 Phases',
  },
  {
    id:      'toss',
    path:    '/toss',
    icon:    '🪙',
    title:   'Toss Impact',
    desc:    'Does the toss actually matter? Venue-by-venue toss winner win rates, bat vs field decision analysis across all seasons.',
    image:   '/assets/hero-frames/img_22.jpg',
    accent:  '#FF1744',
    tag:     'Venue Filter',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [heroIdx, setHeroIdx]   = useState(0);
  const [heroFade, setHeroFade] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [online, setOnline] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [urlInput, setUrlInput] = useState(getApiBaseUrl());

  useEffect(() => {
    checkBackendHealth().then(status => setOnline(status));
    const interval = setInterval(() => {
      checkBackendHealth().then(status => setOnline(status));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const saveUrl = () => {
    setApiBaseUrl(urlInput);
    setShowConfig(false);
    setOnline(null);
    checkBackendHealth().then(status => setOnline(status));
    window.location.reload();
  };

  useEffect(() => {
    const t = setInterval(() => {
      setHeroFade(false);
      setTimeout(() => { setHeroIdx(i => (i + 1) % HERO_IMAGES.length); setHeroFade(true); }, 600);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#0B0F19' }}>

      {/* ── HERO ── */}
      <div style={{ position:'relative', height:'100vh', overflow:'hidden' }}>

        {/* Rotating background */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${HERO_IMAGES[heroIdx]})`,
          backgroundSize:'cover', backgroundPosition: heroIdx === 1 ? 'center 8%' : 'center center',
          opacity: heroFade ? 0.3 : 0,
          transition:'opacity 0.8s ease',
          filter:'saturate(1.3) brightness(0.8)',
        }}/>

        {/* Gradient overlays */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(11,15,25,0.5) 0%, rgba(11,15,25,0.15) 40%, rgba(11,15,25,0.95) 100%)',
        }}/>
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:`
            radial-gradient(ellipse 80% 50% at 20% 10%, rgba(0,242,254,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,230,118,0.05) 0%, transparent 60%)
          `,
        }}/>

        {/* Top Navbar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '24px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          zIndex: 40
        }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>
            <span style={{ color: '#fff' }}>Cricket</span>
            <span style={{
              background: 'linear-gradient(135deg,#00F2FE,#00E676)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>IQ</span>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px', borderRadius: 50,
              background: online === true ? 'rgba(0,230,118,0.12)' : online === false ? 'rgba(255,23,68,0.12)' : 'rgba(255,215,0,0.12)',
              border: `1px solid ${online === true ? 'rgba(0,230,118,0.3)' : online === false ? 'rgba(255,23,68,0.3)' : 'rgba(255,215,0,0.3)'}`,
              color: online === true ? '#00E676' : online === false ? '#FF1744' : '#FFD700',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em',
              backdropFilter: 'blur(8px)'
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: online === true ? '#00E676' : online === false ? '#FF1744' : '#FFD700',
              boxShadow: `0 0 8px ${online === true ? '#00E676' : online === false ? '#FF1744' : '#FFD700'}`
            }}/>
            {online === true ? 'Backend Connected' : online === false ? 'Backend Offline / Setup' : 'Connecting API...'}
          </button>
        </div>

        {/* Hero content */}
        <div style={{
          position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 24px', zIndex:10,
        }}>
          {/* Badge */}
          <div className="stagger-1" style={{
            display:'inline-flex', alignItems:'center', gap:8,
            padding:'7px 20px', borderRadius:50, marginBottom:28,
            border:'1px solid rgba(0,242,254,0.3)', background:'rgba(0,242,254,0.08)',
            color:'#00F2FE', fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
          }}>
            🏏 AI-Powered · 1,235 IPL Matches · 2007–2026
          </div>

          {/* Title */}
          <h1 className="stagger-2" style={{
            fontSize:'clamp(4rem,12vw,9rem)', fontWeight:900,
            lineHeight:1, letterSpacing:'-0.03em', marginBottom:20,
          }}>
            <span style={{ color:'#fff' }}>Cricket</span>
            <span style={{
              background:'linear-gradient(135deg,#00F2FE,#00E676)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>IQ</span>
          </h1>

          {/* Subtitle */}
          <p className="stagger-3" style={{
            color:'#94a3b8', fontSize:'clamp(1rem,2.2vw,1.25rem)',
            maxWidth:560, margin:'0 auto 40px', fontWeight:300, lineHeight:1.75,
          }}>
            Real-time IPL analytics powered by machine learning.
            Predict outcomes. Analyse players. Understand the game.
          </p>

          {/* CTAs */}
          <div className="stagger-4" style={{ display:'flex', gap:14, flexWrap:'wrap', justifyContent:'center' }}>
            <button onClick={() => navigate('/prediction')} style={{
              padding:'14px 36px', borderRadius:50,
              background:'linear-gradient(135deg,#00F2FE,#00E676)',
              color:'#0B0F19', fontWeight:800, fontSize:14, border:'none', cursor:'pointer',
              boxShadow:'0 0 28px rgba(0,242,254,0.35)', transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform='scale(1.05)'; e.currentTarget.style.boxShadow='0 0 44px rgba(0,242,254,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 0 28px rgba(0,242,254,0.35)'; }}
            >
              Start Predicting ↓
            </button>
            <div style={{
              padding:'14px 36px', borderRadius:50,
              border:'1px solid rgba(255,255,255,0.15)',
              color:'#cbd5e1', fontSize:14,
            }}>
              52.9% Honest CV Accuracy
            </div>
          </div>

          {/* Image dots */}
          <div className="stagger-5" style={{ display:'flex', gap:6, marginTop:44 }}>
            {HERO_IMAGES.map((_,i) => (
              <div key={i} onClick={() => { setHeroFade(false); setTimeout(()=>{ setHeroIdx(i); setHeroFade(true); },300); }}
                style={{
                  width: i===heroIdx ? 22 : 6, height:6, borderRadius:3,
                  background: i===heroIdx ? '#00F2FE' : 'rgba(255,255,255,0.2)',
                  cursor:'pointer', transition:'all 0.4s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          color:'#334155', fontSize:11,
        }}>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom, #00F2FE66, transparent)' }}/>
          scroll to explore
        </div>
      </div>

      {/* ── FEATURE CARDS ── */}
      <div style={{ padding:'80px 32px', maxWidth:1280, margin:'0 auto' }}>
        <div className="stagger-1" style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{
            display:'inline-block', padding:'6px 18px', borderRadius:50, marginBottom:16,
            border:'1px solid rgba(255,215,0,0.3)', background:'rgba(255,215,0,0.08)',
            color:'#FFD700', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
          }}>
            6 Analytics Modules
          </div>
          <h2 style={{ fontSize:'clamp(2rem,5vw,3.5rem)', fontWeight:900, color:'#fff', lineHeight:1.1 }}>
            Everything you need to<br/>
            <span style={{ background:'linear-gradient(135deg,#00F2FE,#00E676)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              understand IPL
            </span>
          </h2>
        </div>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))',
          gap:24,
        }}>
          {FEATURES.map((f, idx) => (
            <div
              key={f.id}
              className={`stagger-${Math.min(idx+1, 6)}`}
              onClick={() => navigate(f.path)}
              onMouseEnter={() => setHoveredCard(f.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position:'relative', borderRadius:20, overflow:'hidden',
                cursor:'pointer', border:`1px solid ${hoveredCard===f.id ? f.accent+'55' : 'rgba(255,255,255,0.08)'}`,
                transition:'all 0.35s ease',
                transform: hoveredCard===f.id ? 'translateY(-6px)' : 'translateY(0)',
                boxShadow: hoveredCard===f.id ? `0 20px 60px ${f.accent}22` : '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              {/* Card image */}
              <div style={{ position:'relative', height:200, overflow:'hidden' }}>
                <img src={f.image} alt={f.title}
                  style={{
                    width:'100%', height:'100%', objectFit:'cover',
                    transition:'transform 0.5s ease',
                    transform: hoveredCard===f.id ? 'scale(1.06)' : 'scale(1)',
                    filter:'brightness(0.65) saturate(1.2)',
                    objectPosition: f.id==='prediction' ? 'center 35%' : 'center center',
                  }}
                />
                {/* Gradient over image */}
                <div style={{
                  position:'absolute', inset:0,
                  background:`linear-gradient(to bottom, transparent 30%, rgba(11,15,25,0.9) 100%)`,
                }}/>
                {/* Icon + tag on image */}
                <div style={{
                  position:'absolute', top:16, left:16, right:16,
                  display:'flex', justifyContent:'space-between', alignItems:'flex-start',
                }}>
                  <div style={{
                    width:44, height:44, borderRadius:12,
                    background:'rgba(11,15,25,0.8)', backdropFilter:'blur(8px)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                    border:'1px solid rgba(255,255,255,0.1)',
                  }}>
                    {f.icon}
                  </div>
                  <div style={{
                    padding:'4px 12px', borderRadius:50,
                    background: `${f.accent}22`,
                    border:`1px solid ${f.accent}55`,
                    color:f.accent, fontSize:10, fontWeight:700, letterSpacing:'0.08em',
                  }}>
                    {f.tag}
                  </div>
                </div>
              </div>

              {/* Card content */}
              <div style={{ padding:'20px 24px 24px', background:'rgba(15,23,42,0.95)' }}>
                <h3 style={{ fontSize:19, fontWeight:800, color:'#fff', marginBottom:8 }}>{f.title}</h3>
                <p style={{ fontSize:13, color:'#64748b', lineHeight:1.65, marginBottom:20 }}>{f.desc}</p>
                <div style={{
                  display:'inline-flex', alignItems:'center', gap:8,
                  color:f.accent, fontSize:13, fontWeight:700, transition:'gap 0.2s',
                }}>
                  Explore {f.title}
                  <span style={{
                    transition:'transform 0.2s',
                    transform: hoveredCard===f.id ? 'translateX(4px)' : 'translateX(0)',
                  }}>→</span>
                </div>
              </div>

              {/* Bottom accent line */}
              <div style={{
                position:'absolute', bottom:0, left:0, right:0, height:2,
                background:`linear-gradient(90deg, transparent, ${f.accent}, transparent)`,
                opacity: hoveredCard===f.id ? 1 : 0,
                transition:'opacity 0.3s',
              }}/>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="stagger-6" style={{
          marginTop:80, padding:'32px 40px',
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:20,
          display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:32,
          textAlign:'center',
        }}>
          {[
            { val:'1,235',   label:'IPL Matches',      col:'#00F2FE' },
            { val:'293,764', label:'Ball-by-Ball Records', col:'#00E676' },
            { val:'19',      label:'Seasons (2007–26)', col:'#FFD700' },
            { val:'40',      label:'Venues Analysed',  col:'#8b5cf6' },
            { val:'52.9%',   label:'Honest CV Accuracy', col:'#f59e0b' },
            { val:'Zero',    label:'Data Leakage',     col:'#FF1744' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize:28, fontWeight:900, color:s.col }}>{s.val}</div>
              <div style={{ fontSize:12, color:'#475569', marginTop:6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Config Modal ── */}
      {showConfig && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="glass-card" style={{
            maxWidth: 500, width: '100%', padding: 28,
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              ⚙️ Backend API Configuration
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 18 }}>
              If your backend is deployed on Render, Railway, or running locally on port 8000, specify the base URL below.
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                API Base URL
              </div>
              <input
                type="text"
                className="inp"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://your-service.onrender.com/api"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{
              fontSize: 12, padding: '10px 14px', borderRadius: 8,
              background: online ? 'rgba(0,230,118,0.1)' : 'rgba(255,215,0,0.1)',
              border: `1px solid ${online ? 'rgba(0,230,118,0.2)' : 'rgba(255,215,0,0.2)'}`,
              color: online ? '#00E676' : '#FFD700', marginBottom: 20
            }}>
              Status: <strong>{online ? 'Connected & Healthy' : 'Unreachable (Check URL or wait for Render to spin up)'}</strong>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfig(false)}
                style={{
                  padding: '9px 18px', borderRadius: 50, background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)', color: '#94a3b8',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={saveUrl}
                style={{ padding: '9px 22px' }}
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
