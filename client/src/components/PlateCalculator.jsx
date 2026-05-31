import { useState } from 'react';
import { calculatePlates, PLATE_COLORS_MAP } from '../utils/plates';

export function PlateModal({ weight, onClose }) {
  const [barbell, setBarbell] = useState(45);
  const { plates, perSide, achievable } = calculatePlates(weight, barbell);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={onClose}>
      <div style={{ background: 'var(--navy-800)', border: '1px solid var(--border-bright)', borderRadius: 16, padding: '1.75rem', width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem' }}>Plate Calculator</h2>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{weight} lbs total</div>
          </div>
          <button className="btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={onClose}>✕</button>
        </div>

        {/* Barbell selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[45, 35, 15].map(b => (
            <button key={b} type="button"
              style={{ flex: 1, padding: '0.4rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${barbell === b ? 'var(--cyan)' : 'var(--border)'}`, background: barbell === b ? 'var(--cyan-dim)' : 'var(--navy-700)', color: barbell === b ? 'var(--cyan)' : 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setBarbell(b)}>
              {b} lb bar
            </button>
          ))}
        </div>

        {/* Barbell visual */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '1.25rem', height: 60 }}>
          {/* Left collar */}
          <div style={{ width: 8, height: 20, background: '#666', borderRadius: '3px 0 0 3px' }} />
          {/* Left plates (reversed so biggest is outermost) */}
          {[...plates].reverse().map((p, i) =>
            Array(p.count).fill(null).map((_, j) => (
              <div key={`l${i}${j}`} style={{ width: Math.max(8, p.weight / 3), height: 48 + p.weight / 4, background: p.color, border: '1px solid rgba(0,0,0,0.3)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: p.weight >= 25 ? 'white' : '#111', writingMode: 'vertical-rl' }}>
                {p.weight}
              </div>
            ))
          )}
          {/* Bar */}
          <div style={{ width: 80, height: 12, background: 'linear-gradient(180deg, #aaa, #777)', borderRadius: 3, zIndex: 1 }} />
          {/* Right plates */}
          {plates.map((p, i) =>
            Array(p.count).fill(null).map((_, j) => (
              <div key={`r${i}${j}`} style={{ width: Math.max(8, p.weight / 3), height: 48 + p.weight / 4, background: p.color, border: '1px solid rgba(0,0,0,0.3)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: p.weight >= 25 ? 'white' : '#111', writingMode: 'vertical-rl' }}>
                {p.weight}
              </div>
            ))
          )}
          {/* Right collar */}
          <div style={{ width: 8, height: 20, background: '#666', borderRadius: '0 3px 3px 0' }} />
        </div>

        {/* Plate breakdown */}
        <div style={{ background: 'var(--navy-700)', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>Per Side — {perSide} lbs</div>
          {plates.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {plates.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', background: `${p.color}22`, border: `1px solid ${p.color}55`, borderRadius: 20 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color }} />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{p.count}×</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.weight} lb</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Just the bar ({barbell} lbs)</div>
          )}
        </div>

        {achievable !== weight && (
          <div style={{ fontSize: '0.78rem', color: 'var(--orange)', background: 'rgba(255,125,59,0.1)', border: '1px solid rgba(255,125,59,0.25)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
            ⚠ Closest achievable weight: {achievable} lbs
          </div>
        )}
      </div>
    </div>
  );
}

// Inline weight chip that opens the modal on click
export function WeightChip({ weight }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', color: 'var(--cyan)', fontWeight: 700, borderBottom: '1px dashed var(--cyan-border)', fontSize: 'inherit' }}
        title="Click to see plate breakdown"
      >
        {weight}
      </span>
      {open && <PlateModal weight={weight} onClose={() => setOpen(false)} />}
    </>
  );
}
