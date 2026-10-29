import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 50;

export default function Hero({ onEnterDashboard }) {
  const heroRef   = useRef(null);
  const canvasRef = useRef(null);
  const imgs      = useRef([]);
  const frameRef  = useRef(0);
  const raf       = useRef(null);
  const [textOpacity, setTextOpacity] = useState(1);
  const [hasFrames,   setHasFrames]   = useState(false);

  useEffect(() => {
    const test = new Image();
    test.onload = () => {
      setHasFrames(true);
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = `/assets/hero-frames/frame_${String(i+1).padStart(3,'0')}.jpg`;
        imgs.current[i] = img;
      }
    };
    test.onerror = () => setHasFrames(false);
    test.src = '/assets/hero-frames/frame_001.jpg';
  }, []);

  useEffect(() => {
    if (!hasFrames) return;
    const drawFrame = (idx) => {
      const c = canvasRef.current;
      if (!c) return;
      const img = imgs.current[idx];
      if (!img?.complete || !img.naturalWidth) return;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
    };
    const onScroll = () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        const h   = heroRef.current?.offsetHeight || window.innerHeight;
        const pct = Math.min(Math.max(window.scrollY / h, 0), 1);
        const idx = Math.min(Math.floor(pct * TOTAL_FRAMES), TOTAL_FRAMES - 1);
        setTextOpacity(Math.max(0, 1 - pct * 2.8));
        if (idx !== frameRef.current) { frameRef.current = idx; drawFrame(idx); }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [hasFrames]);

  return (
    <div ref={heroRef} style={{ height:'190vh', position:'relative' }}>
      <div style={{ position:'sticky', top:0, height:'100vh', overflow:'hidden' }}>

        {/* Canvas / gradient bg */}
        {hasFrames
          ? <canvas ref={canvasRef} width={1920} height={1080}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.7 }}/>
          : <div style={{ position:'absolute', inset:0,
              background:'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(255,107,0,0.25) 0%, transparent 60%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(227,6,19,0.15) 0%, transparent 60%), #0A0A0A' }}/>
        }

        {/* Dark gradient overlay */}
        <div style={{ position:'absolute', inset:0,
          background:'linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.1) 40%, rgba(10,10,10,0.8) 85%, #0A0A0A 100%)',
          pointerEvents:'none' }}/>

        {/* Hero text */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', textAlign:'center', padding:'0 24px',
          opacity: textOpacity, transition:'opacity 0.1s linear', zIndex:10 }}>

          <div style={{ fontSize:'clamp(0.65rem,1.2vw,0.8rem)', fontWeight:700, letterSpacing:'0.2em',
            textTransform:'uppercase', color:'#FF6B00', marginBottom:16 }}>
            🏏 IPL Analytics Platform · 1,235 Matches · 2007–2026
          </div>

          <h1 style={{ fontSize:'clamp(2.8rem,8vw,7rem)', fontWeight:900, lineHeight:1,
            textTransform:'uppercase', letterSpacing:'-0.02em', color:'#fff', marginBottom:8 }}>
            Cricket
            <span style={{ background:'linear-gradient(135deg,#FF6B00,#FFD700)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}> IQ</span>
          </h1>

          <p style={{ fontSize:'clamp(0.9rem,1.8vw,1.1rem)', fontWeight:300, color:'#AAAAAA',
            maxWidth:540, lineHeight:1.75, marginTop:12, marginBottom:36 }}>
            AI-powered pre-match predictions, live win probability, player matchups
            and venue analytics — all from 293,764 ball-by-ball IPL records.
          </p>

          <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
            <a href="#dashboard"
              style={{ background:'linear-gradient(135deg,#FF6B00,#E30613)', color:'#fff',
                fontWeight:700, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.1em',
                padding:'14px 32px', borderRadius:6, textDecoration:'none',
                boxShadow:'0 4px 20px rgba(255,107,0,0.4)', transition:'transform 0.2s,box-shadow 0.2s' }}
              onMouseEnter={e => { e.target.style.transform='translateY(-2px)'; e.target.style.boxShadow='0 8px 28px rgba(255,107,0,0.55)'; }}
              onMouseLeave={e => { e.target.style.transform='translateY(0)'; e.target.style.boxShadow='0 4px 20px rgba(255,107,0,0.4)'; }}>
              Explore Analytics ↓
            </a>
            <div style={{ border:'1px solid rgba(255,255,255,0.2)', color:'#ccc',
              fontWeight:600, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.1em',
              padding:'14px 32px', borderRadius:6 }}>
              52.9% CV Accuracy
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          opacity: textOpacity > 0.4 ? 1 : 0, transition:'opacity 0.3s', color:'#666', fontSize:'0.7rem',
          textTransform:'uppercase', letterSpacing:'0.15em' }}>
          <div style={{ width:1, height:40,
            background:'linear-gradient(to bottom,#FF6B00,transparent)', animation:'pulse 2s ease infinite' }}/>
          Scroll
        </div>
      </div>
    </div>
  );
}
