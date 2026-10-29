import React, { useEffect, useState } from 'react';

const IMAGES = Array.from({ length: 23 }, (_, i) =>
  `/assets/hero-frames/img_${String(i + 1).padStart(2, '0')}.jpg`
);

export default function ScrollAnimationHero() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade]       = useState(true);
  const [textOpacity, setTextOpacity] = useState(1);

  // Auto-rotate images every 3.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent(c => (c + 1) % IMAGES.length);
        setFade(true);
      }, 600);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Fade text on scroll
  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / window.innerHeight, 1);
      setTextOpacity(Math.max(0, 1 - progress * 2));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="relative w-full" style={{ height: '160vh' }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* Rotating background image */}
        <div
          style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${IMAGES[current]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: fade ? 0.35 : 0,
            transition: 'opacity 0.8s ease',
            filter: 'saturate(1.2)',
          }}
        />

        {/* Dark canvas overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,15,25,0.55) 0%, rgba(11,15,25,0.2) 40%, rgba(11,15,25,0.85) 100%)',
        }}/>

        {/* Gradient mesh */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 50% at 20% 10%, rgba(0,242,254,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0,230,118,0.05) 0%, transparent 60%)
          `,
        }}/>

        {/* Hero text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '0 24px',
          opacity: textOpacity, transition: 'opacity 0.2s linear',
          zIndex: 10,
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 18px', borderRadius: 50, marginBottom: 24,
            border: '1px solid rgba(0,242,254,0.3)',
            background: 'rgba(0,242,254,0.08)',
            color: '#00F2FE', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
            animation: 'fadeUp 0.6s 0.1s ease both',
          }}>
            🏏 AI-Powered · 1,235 IPL Matches · 2007–2026
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 'clamp(3.5rem, 11vw, 8rem)',
            fontWeight: 900, lineHeight: 1,
            letterSpacing: '-0.03em', margin: '0 0 20px',
            animation: 'fadeUp 0.6s 0.2s ease both',
          }}>
            <span style={{ color: '#fff' }}>Cricket</span>
            <span style={{
              background: 'linear-gradient(135deg, #00F2FE, #00E676)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>IQ</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            color: '#94a3b8', fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            maxWidth: 540, margin: '0 auto 36px',
            fontWeight: 300, lineHeight: 1.7,
            animation: 'fadeUp 0.6s 0.3s ease both',
          }}>
            Real-time IPL analytics powered by machine learning.
            Predict outcomes. Analyse players. Understand the game.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
            animation: 'fadeUp 0.6s 0.4s ease both',
          }}>
            <a href="#dashboard" style={{
              padding: '13px 32px', borderRadius: 50,
              background: 'linear-gradient(135deg, #00F2FE, #00E676)',
              color: '#0B0F19', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 0 24px rgba(0,242,254,0.3)',
            }}
              onMouseEnter={e => { e.target.style.transform='scale(1.05)'; e.target.style.boxShadow='0 0 36px rgba(0,242,254,0.5)'; }}
              onMouseLeave={e => { e.target.style.transform='scale(1)';    e.target.style.boxShadow='0 0 24px rgba(0,242,254,0.3)'; }}
            >
              Explore Analytics ↓
            </a>
            <div style={{
              padding: '13px 32px', borderRadius: 50,
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#cbd5e1', fontSize: 14,
            }}>
              52.9% CV Accuracy
            </div>
          </div>

          {/* Image dots indicator */}
          <div style={{ display:'flex', gap:6, marginTop:40, animation:'fadeUp 0.6s 0.5s ease both' }}>
            {IMAGES.map((_, i) => (
              <div key={i} onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 300); }}
                style={{
                  width: i === current ? 20 : 6, height: 6,
                  borderRadius: 3, cursor: 'pointer', transition: 'all 0.4s ease',
                  background: i === current ? '#00F2FE' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          color:'#475569', fontSize:11, opacity: textOpacity > 0.3 ? 1 : 0,
          transition:'opacity 0.3s',
        }}>
          <div style={{ width:1, height:32, background:'linear-gradient(to bottom, #00F2FE88, transparent)', animation:'pulse 2s ease infinite' }}/>
          scroll to explore
        </div>
      </div>

      {/* Spacer to allow scrolling */}
      <div style={{ height:'60vh' }}/>
    </div>
  );
}
