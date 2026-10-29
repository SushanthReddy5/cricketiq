import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageLayout({ title, icon, desc, heroImage, accentColor, children }) {
  const navigate = useNavigate();

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
          <div style={{ fontSize:18, fontWeight:900 }}>
            <span style={{ color:'#fff' }}>Cricket</span>
            <span style={{
              background:'linear-gradient(135deg,#00F2FE,#00E676)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>IQ</span>
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

      {/* ── Content ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 32px' }}>
        {children}
      </div>
    </div>
  );
}
