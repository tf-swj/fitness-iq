import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from 'recharts';
import { getEngineStats, getExercises, getExerciseHistory, getDailyBrief, getPRs } from '../api';
import { MUSCLE_COLORS } from '../data/exercises';
import { useCountUp } from '../hooks/useCountUp';

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f2035', border: '1px solid rgba(0,212,232,0.3)', borderRadius: 10, padding: '0.65rem 1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: '0.72rem', color: '#4a6a82', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#00d4e8', fontSize: '1rem' }}>{payload[0].value} lbs</div>
    </div>
  );
};

function AnimatedStat({ value, prefix = '', suffix = '', decimals = 0 }) {
  const num = useCountUp(parseFloat(value) || 0, 1200, decimals);
  if (!value && value !== 0) return <span>—</span>;
  return <span>{prefix}{decimals > 0 ? num.toFixed(decimals) : Math.round(num)}{suffix}</span>;
}

function TypingText({ text }) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(iv);
    }, 18);
    return () => clearInterval(iv);
  }, [text]);
  return <span>{displayed}</span>;
}

export default function Dashboard({ onNavigate }) {
  const [engine, setEngine]         = useState(null);
  const [exercises, setExercises]   = useState([]);
  const [selectedEx, setSelectedEx] = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [brief, setBrief]           = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [latestPRs, setLatestPRs]   = useState([]);

  useEffect(() => {
    Promise.all([getEngineStats(), getExercises(), getPRs()])
      .then(([eng, exs, prs]) => {
        setEngine(eng.data);
        setExercises(exs.data);
        setLatestPRs(prs.data || []);
        if (exs.data.length) setSelectedEx(exs.data[0].exercise_name);
      })
      .finally(() => setLoading(false));

    // Load AI daily brief
    setBriefLoading(true);
    getDailyBrief()
      .then(r => setBrief(r.data))
      .catch(() => {})
      .finally(() => setBriefLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEx) return;
    getExerciseHistory(selectedEx).then(r => {
      const byDate = {};
      for (const row of r.data) {
        const e1rm = Math.round(row.weight_lbs * (1 + row.reps / 30) * 10) / 10;
        if (!byDate[row.date] || e1rm > byDate[row.date].e1rm)
          byDate[row.date] = { date: row.date.slice(5), e1rm };
      }
      setHistory(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    });
  }, [selectedEx]);

  if (loading) return <div className="loading">Loading your stats...</div>;

  if (!engine || !exercises.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏋️</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No workouts yet</h3>
        <p>Head to <strong style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => onNavigate?.('Log Workout')}>Log Workout</strong> to record your first session.</p>
      </div>
    );
  }

  const gainEntries = Object.entries(engine.gains || {});
  const volumeData  = Object.entries(engine.volume || {}).map(([mg, vol]) => ({ mg, vol: Math.round(vol / 1000 * 10) / 10 })).sort((a, b) => b.vol - a.vol);
  const bestGain    = gainEntries.reduce((max, [, g]) => g.percentGain > (max?.percentGain ?? -Infinity) ? g : max, null);
  const totalVolume = Object.values(engine.volume || {}).reduce((s, v) => s + v, 0);
  const histChange  = history.length > 1 ? Math.round((history[history.length-1].e1rm - history[0].e1rm) / history[0].e1rm * 1000) / 10 : null;

  return (
    <>
      {/* ── AI Daily Brief ── */}
      <div className="card accent-border" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, var(--navy-800), #0d2a3a)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>◈</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Alex · Your AI Coach</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Daily Brief</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, minHeight: '2.5rem' }}>
              {briefLoading ? (
                <span style={{ color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--cyan)', marginRight: 6, animation: 'pulse 1s infinite' }} />
                  Analyzing your training data...
                </span>
              ) : brief?.text ? (
                <TypingText text={brief.text} />
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>Add your Anthropic API key to enable AI coaching insights.</span>
              )}
            </div>
          </div>
          <button className="btn-secondary" style={{ fontSize: '0.78rem', flexShrink: 0 }} onClick={() => onNavigate?.('AI Coach')}>
            Chat with Alex →
          </button>
        </div>
      </div>

      {/* ── PR Banner ── */}
      {latestPRs.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, rgba(0,212,232,0.1), rgba(0,212,232,0.05))', border: '1px solid var(--cyan-border)', borderRadius: 12, padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '1.2rem' }}>🏆</span>
          <span style={{ fontWeight: 700, color: 'var(--cyan)', fontSize: '0.875rem' }}>Personal Records in last session:</span>
          {latestPRs.map(pr => (
            <span key={pr.exercise} style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 20, padding: '0.2rem 0.65rem', fontSize: '0.78rem', color: 'var(--cyan)', fontWeight: 600 }}>
              {pr.exercise} — {pr.e1rm} lbs e1RM
            </span>
          ))}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="stat-grid">
        <div className={`stat-card ${engine.plateaus?.length ? '' : 'active-stat'}`}>
          <div className="stat-icon cyan">📈</div>
          <div className="stat-value cyan"><AnimatedStat value={exercises.length} /></div>
          <div className="stat-label">Exercises Tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">🏆</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>
            {bestGain ? <><span style={{ fontSize: '1.2rem' }}>+</span><AnimatedStat value={bestGain.percentGain} decimals={1} suffix="%" /></> : '—'}
          </div>
          <div className="stat-label">Best Strength Gain</div>
        </div>
        <div className="stat-card" style={engine.plateaus?.length ? { borderColor: 'rgba(255,125,59,0.35)' } : {}}>
          <div className="stat-icon orange">⚡</div>
          <div className="stat-value" style={{ color: engine.plateaus?.length ? 'var(--orange)' : 'var(--text-primary)' }}>
            <AnimatedStat value={engine.plateaus?.length || 0} />
          </div>
          <div className="stat-label">Active Plateaus</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🔥</div>
          <div className="stat-value">
            {totalVolume ? <><AnimatedStat value={Math.round(totalVolume / 1000)} />k</> : '—'}
          </div>
          <div className="stat-label">This Week (lbs)</div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {(engine.plateaus?.length > 0 || engine.deloadRecommended) && (
        <div className="card">
          <div className="card-header">
            <h2>Attention Required</h2>
            <span className="badge badge-orange">{(engine.plateaus?.length || 0) + (engine.deloadRecommended ? 1 : 0)} Alert{((engine.plateaus?.length || 0) + (engine.deloadRecommended ? 1 : 0)) > 1 ? 's' : ''}</span>
          </div>
          {engine.plateaus?.map((p, i) => (
            <div key={i} className="alert alert-warn">
              <span>⚠️</span>
              <div>
                <div className="alert-title">{p.exercise} — Plateau Detected</div>
                <div className="alert-body">Stalled at {p.currentE1RM} lbs e1RM for {p.weeks} weeks. <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => onNavigate?.('AI Coach')}>Ask Alex for a fix →</span></div>
              </div>
            </div>
          ))}
          {engine.deloadRecommended && (
            <div className="alert alert-info">
              <span>🔄</span>
              <div>
                <div className="alert-title">Deload Week Recommended</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>4+ weeks of continuous training.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Strength + Gains ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div><h2>Strength Curve</h2><div className="card-subtitle">Estimated 1RM over time</div></div>
            {histChange !== null && <span className={histChange >= 0 ? 'gain-positive' : 'gain-negative'}>{histChange >= 0 ? '▲' : '▼'} {Math.abs(histChange)}%</span>}
          </div>
          <div className="muscle-tabs">
            {exercises.map(ex => (
              <button key={ex.exercise_name} type="button" className={`muscle-tab ${selectedEx === ex.exercise_name ? 'active' : ''}`} onClick={() => setSelectedEx(ex.exercise_name)}>{ex.exercise_name}</button>
            ))}
          </div>
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={history} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4e8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00d4e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4a6a82' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#4a6a82' }} width={50} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="e1rm" stroke="#00d4e8" strokeWidth={2} fill="url(#cyanGrad)" dot={{ r: 4, fill: '#00d4e8', stroke: '#0b1829', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem' }}>Log 2+ sessions to see the curve.</div>
          )}
        </div>

        {gainEntries.length > 0 && (
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header"><div><h2>All-Time Gains</h2><div className="card-subtitle">e1RM progress</div></div></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Exercise</th><th>Change</th><th>%</th></tr></thead>
                <tbody>
                  {gainEntries.sort(([,a],[,b]) => b.percentGain - a.percentGain).map(([ex, g]) => (
                    <tr key={ex}>
                      <td style={{ fontWeight: 500 }}>{ex}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{g.firstE1RM}→<strong style={{ color: 'var(--text-secondary)' }}>{g.currentE1RM}</strong></td>
                      <td><span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>{g.percentGain >= 0 ? '+' : ''}{g.percentGain}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Volume ── */}
      {volumeData.length > 0 && (
        <div className="card">
          <div className="card-header"><div><h2>Weekly Volume</h2><div className="card-subtitle">This week — thousands of lbs</div></div></div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={volumeData} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="mg" tick={{ fontSize: 10, fill: '#4a6a82' }} angle={-25} textAnchor="end" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#4a6a82' }} width={35} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: '#0f2035', border: '1px solid rgba(0,212,232,0.3)', borderRadius: 8, padding: '0.6rem 0.9rem' }}>
                  <div style={{ fontSize: '0.72rem', color: '#4a6a82' }}>{label}</div>
                  <div style={{ fontWeight: 700, color: '#00d4e8' }}>{payload[0].value}k lbs</div>
                </div>
              ) : null} />
              <Bar dataKey="vol" radius={[6, 6, 0, 0]}>
                {volumeData.map((entry, i) => <Cell key={i} fill={MUSCLE_COLORS[entry.mg] || '#00d4e8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </>
  );
}
