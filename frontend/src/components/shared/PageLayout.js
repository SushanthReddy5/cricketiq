import React from 'react';
import Header from './Header';

export default function PageLayout({ children, title, subtitle, icon, heroBg }) {
  return (
    <div style={{ minHeight:'100vh', background:'var(--cream)' }}>
      <Header alwaysSolid/>

      <div style={{ position:'relative', height:260, overflow:'hidden' }}>
        {heroBg && (
          <div style={{ position:'absolute', inset:0,
            backgroundImage:`url('${heroBg}')`,
            backgroundSize:'cover', backgroundPosition:'center',
            filter:'brightness(0.25)' }}/>
        )}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(135deg,rgba(24,13,5,0.65) 0%,rgba(45,18,8,0.5) 50%,rgba(24,13,5,0.85) 100%)' }}/>
        <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
          width:500, height:2,
          background:'linear-gradient(90deg,transparent,rgba(232,98,42,0.5),transparent)' }}/>

        <div style={{ position:'relative', zIndex:2, height:'100%', display:'flex',
          flexDirection:'column', alignItems:'flex-start', justifyContent:'flex-end',
          maxWidth:1320, margin:'0 auto', padding:'0 40px 32px' }}>
          <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
          <h1 style={{ fontSize:'clamp(1.8rem,4vw,2.8rem)', fontWeight:900,
            textTransform:'uppercase', letterSpacing:'-0.02em',
            color:'#fff', lineHeight:1, margin:0 }}>{title}</h1>
          {subtitle && <p style={{ fontSize:'0.82rem',
            color:'rgba(255,255,255,0.45)', marginTop:6 }}>{subtitle}</p>}
          <div style={{ width:48, height:3,
            background:'linear-gradient(90deg,#E8622A,#D4922A)',
            borderRadius:2, marginTop:14 }}/>
        </div>
      </div>

      <div style={{ maxWidth:1320, margin:'0 auto', padding:'40px 40px 80px' }}>
        {children}
      </div>

      <footer style={{ background:'#180D05', padding:'24px 40px', textAlign:'center',
        borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.2)',
          textTransform:'uppercase', letterSpacing:'0.15em' }}>
          CricketIQ · AI-Powered IPL Analytics · 1,235 Matches · 2007–2026
        </div>
      </footer>
    </div>
  );
}
