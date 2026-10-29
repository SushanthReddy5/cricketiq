import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';

const NAV = [
  { path:'/prediction', label:'Match Prediction' },
  { path:'/winprob',    label:'Win Probability'  },
  { path:'/venue',      label:'Venue Analytics'  },
  { path:'/matchup',    label:'Head to Head'     },
  { path:'/phase',      label:'Phase Analytics'  },
  { path:'/toss',       label:'Toss Impact'      },
];

export default function Header({ alwaysSolid = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const solid = alwaysSolid || scrolled;

  return (
    <header style={{
      position:'fixed', top:0, left:0, right:0, zIndex:300,
      background: solid ? 'linear-gradient(135deg,#180D05 0%,#2D1208 100%)' : 'transparent',
      backdropFilter: solid ? 'blur(20px)' : 'none',
      borderBottom: solid ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      transition:'all 0.35s ease',
      padding:'0 40px',
    }}>
      <div style={{ maxWidth:1320, margin:'0 auto', display:'flex',
        alignItems:'center', justifyContent:'space-between', height:64 }}>

        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
          <Logo size={36}/>
          <div>
            <span style={{ fontSize:'1.1rem', fontWeight:900, color:'#fff', letterSpacing:'-0.02em' }}>Cricket</span>
            <span style={{ fontSize:'1.1rem', fontWeight:900,
              background:'linear-gradient(135deg,#E8622A,#D4922A)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>IQ</span>
          </div>
        </Link>

        <nav style={{ display:'flex', gap:28, alignItems:'center' }}>
          {NAV.map(n => (
            <Link key={n.path} to={n.path}
              className={`nav-link ${location.pathname===n.path?'active':''}`}
              style={{ textDecoration:'none' }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ padding:'6px 14px', borderRadius:20,
            background:'rgba(232,98,42,0.85)', color:'#fff',
            fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.06em',
            textTransform:'uppercase', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#fff',
              display:'inline-block' }}/>
            Live 2026
          </div>
        </div>
      </div>

      {menuOpen && (
        <div style={{ background:'#180D05', borderTop:'1px solid rgba(255,255,255,0.07)', padding:'8px 0' }}>
          {NAV.map(n => (
            <Link key={n.path} to={n.path} onClick={() => setMenuOpen(false)}
              style={{ display:'block', padding:'12px 40px',
                color: location.pathname===n.path?'#E8622A':'rgba(255,255,255,0.7)',
                fontSize:'0.82rem', fontWeight:600, textTransform:'uppercase',
                letterSpacing:'0.08em', textDecoration:'none' }}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
