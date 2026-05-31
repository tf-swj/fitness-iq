import { useState, useEffect, useRef } from 'react';

const PRESETS = [60, 90, 120, 180, 300];

export default function RestTimer() {
  const [open, setOpen]         = useState(false);
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(null);
  const [running, setRunning]   = useState(false);
  const intervalRef             = useRef(null);

  useEffect(() => {
    if (running && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false);
            // vibrate if supported
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start = (d = duration) => {
    clearInterval(intervalRef.current);
    setDuration(d);
    setRemaining(d);
    setRunning(true);
    setOpen(true);
  };

  const pause = () => { setRunning(false); clearInterval(intervalRef.current); };
  const reset = () => { setRunning(false); setRemaining(duration); clearInterval(intervalRef.current); };

  const mins = Math.floor((remaining ?? duration) / 60);
  const secs = ((remaining ?? duration) % 60).toString().padStart(2, '0');
  const progress = remaining !== null ? remaining / duration : 1;
  const isDone = remaining === 0;
  const circumference = 2 * Math.PI * 26;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => running || remaining !== null ? setOpen(o => !o) : start()}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 150,
          width: 52, height: 52, borderRadius: '50%',
          background: running ? 'var(--cyan)' : isDone ? 'var(--green)' : 'var(--navy-700)',
          border: `2px solid ${running ? 'var(--cyan)' : isDone ? 'var(--green)' : 'var(--border-bright)'}`,
          color: running ? 'var(--navy-900)' : 'var(--text-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: running ? '0.72rem' : '1.2rem',
          fontWeight: 700, cursor: 'pointer',
          boxShadow: running ? '0 0 16px rgba(0,212,232,0.4)' : isDone ? '0 0 16px rgba(34,197,94,0.4)' : 'var(--shadow)',
          transition: 'all 0.2s',
        }}
        title="Rest Timer"
      >
        {running ? `${mins}:${secs}` : isDone ? '✓' : '⏱'}
      </button>

      {/* Timer panel */}
      {open && (
        <div style={{ position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 150, background: 'var(--navy-800)', border: '1px solid var(--border-bright)', borderRadius: 16, padding: '1.5rem', width: 220, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Rest Timer</span>
            <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>

          {/* Circular progress */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r="26" fill="none" stroke="var(--navy-700)" strokeWidth="4" />
                <circle cx="36" cy="36" r="26" fill="none"
                  stroke={isDone ? 'var(--green)' : 'var(--cyan)'}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: isDone ? 'var(--green)' : 'var(--text-primary)' }}>
                {isDone ? '✓' : `${mins}:${secs}`}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
            {running ? (
              <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '0.4rem' }} onClick={pause}>Pause</button>
            ) : (
              <button type="button" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.4rem' }} onClick={() => { setRunning(true); }}>
                {remaining === null ? 'Start' : 'Resume'}
              </button>
            )}
            <button type="button" className="btn-secondary" style={{ padding: '0.4rem 0.75rem' }} onClick={reset}>↺</button>
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {PRESETS.map(p => (
              <button key={p} type="button"
                style={{ flex: '1 0 calc(33% - 4px)', padding: '0.3rem', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, border: `1px solid ${duration === p && remaining !== null ? 'var(--cyan)' : 'var(--border)'}`, background: duration === p && remaining !== null ? 'var(--cyan-dim)' : 'var(--navy-700)', color: duration === p && remaining !== null ? 'var(--cyan)' : 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => start(p)}>
                {p >= 60 ? `${p/60}m` : `${p}s`}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
