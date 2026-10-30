import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkBackendHealth, getApiBaseUrl, setApiBaseUrl } from '../api';

export default function PageLayout({ title, icon, desc, heroImage, accentColor, children }) {
  const navigate = useNavigate();
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

  return (
    <div style={{ minHeight:'100vh', background:'#0B0F19' }}>

      {/* ── Hero banner ── */}
      <div style={{ position:'relative', height:320, overflow:'hidden' }}>
        {/* Background image */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`url(${heroImage})`,
          backgroundSize:'cover', backgroundPosition:'center',
          filter:'brightness(0.4) saturate(1.2)',
        }}/>
        {/* Overlays */}
        <div style={{
          position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(11,15,25,0.3) 0%, rgba(11,15,25,0.95) 100%)',
        }}/>
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(ellipse 60% 100% at 50% 0%, ${accentColor}12 0%, transparent 70%)`,
        }}/>

        {/* Nav bar */}
        <div style={{
          position:'absolute', top:0, left:0, right:0,
          padding:'20px 32px', display:'flex', alignItems:'center', gap:16,
          borderBottom:'1px solid rgba(255,255,255,0.05)',
          background:'rgba(11,15,25,0.6)', backdropFilter:'blur(12px)',
          zIndex: 40
        }}>
          <button onClick={() => navigate('/')} style={{
            display:'flex', alignItems:'center', gap:8,
            color:'#64748b', background:'none', border:'none',
            cursor:'pointer', fontSize:13, transition:'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color='#cbd5e1'}
            onMouseLeave={e => e.currentTarget.style.color='#64748b'}
          >
            ← Back
          </button>
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.1)' }}/>
          <div style={{ fontSize:18, fontWeight:900, cursor:'pointer' }} onClick={() => navigate('/')}>
            <span style={{ color:'#fff' }}>Cricket</span>
            <span style={{
              background:'linear-gradient(135deg,#00F2FE,#00E676)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>IQ</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 14px', borderRadius: 50,
                background: online === true ? 'rgba(0,230,118,0.12)' : online === false ? 'rgba(255,23,68,0.12)' : 'rgba(255,215,0,0.12)',
                border: `1px solid ${online === true ? 'rgba(0,230,118,0.3)' : online === false ? 'rgba(255,23,68,0.3)' : 'rgba(255,215,0,0.3)'}`,
                color: online === true ? '#00E676' : online === false ? '#FF1744' : '#FFD700',
                fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em'
              }}
              title="Click to check or configure API URL"
            >
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: online === true ? '#00E676' : online === false ? '#FF1744' : '#FFD700',
                boxShadow: `0 0 8px ${online === true ? '#00E676' : online === false ? '#FF1744' : '#FFD700'}`
              }}/>
              {online === true ? 'Backend Connected' : online === false ? 'Backend Offline / Setup' : 'Connecting API...'}
            </button>
          </div>
        </div>

        {/* Page title */}
        <div style={{
          position:'absolute', bottom:36, left:0, right:0, padding:'0 32px',
          display:'flex', alignItems:'flex-end', gap:20,
        }}>
          <div style={{
            width:56, height:56, borderRadius:16, flexShrink:0,
            background:'rgba(11,15,25,0.8)', backdropFilter:'blur(8px)',
            border:`1px solid ${accentColor}44`,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:28,
          }}>
            {icon}
          </div>
          <div>
            <div style={{
              fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
              color:accentColor, marginBottom:6,
            }}>
              CricketIQ Analytics
            </div>
            <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900, color:'#fff', margin:0 }}>
              {title}
            </h1>
            {desc && <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>{desc}</p>}
          </div>
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

      {/* ── Content ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>
        {children}
      </div>
    </div>
  );
}
