import React, { useState, useRef, useEffect } from 'react';

export default function PlayerSearch({ players, value, onChange, label, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setFiltered([]); return; }
    const q = query.toLowerCase();
    setFiltered((players || []).filter(p => p.toLowerCase().includes(q)).slice(0, 10));
  }, [query, players]);

  const select = p => {
    setQuery(p);
    onChange(p);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {label && (
        <div style={{
          fontSize: 10, color: '#64748b', textTransform: 'uppercase',
          letterSpacing: '0.1em', marginBottom: 6, fontWeight: 700
        }}>
          {label}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="inp"
          value={query}
          placeholder={placeholder || 'Search player...'}
          onChange={e => {
            setQuery(e.target.value);
            onChange('');
            setOpen(true);
          }}
          onFocus={() => { if (query) setOpen(true); }}
          autoComplete="off"
          style={{ paddingRight: 32 }}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); onChange(''); }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: '#64748b', fontSize: 18,
              cursor: 'pointer', lineHeight: 1
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 12, maxHeight: 220, overflowY: 'auto', marginTop: 4,
          backdropFilter: 'blur(16px)', boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
        }}>
          {filtered.map(p => (
            <div
              key={p}
              onClick={() => select(p)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: '#e2e8f0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'all 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0, 242, 254, 0.12)';
                e.currentTarget.style.color = '#00F2FE';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#e2e8f0';
              }}
            >
              {p}
            </div>
          ))}
        </div>
      )}

      {open && query && filtered.length === 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
          background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 12, padding: '12px 14px', color: '#64748b', fontSize: 13, marginTop: 4,
          backdropFilter: 'blur(16px)'
        }}>
          No results for "{query}"
        </div>
      )}
    </div>
  );
}
