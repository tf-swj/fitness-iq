import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from 'recharts';
import { getEngineStats, getExercises, getExerciseHistory } from '../api';
import { MUSCLE_COLORS } from '../data/exercises';

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f2035', border: '1px solid rgba(0,212,232,0.3)', borderRadius: 10, padding: '0.65rem 1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
      <div style={{ fontSize: '0.72rem', color: '#4a6a82', marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontWeight: 700, color: '#00d4e8', fontSize: '1rem' }}>{payload[0].value} lbs</div>
    </div>
  );
};

export default function Dashboard({ onNavigate }) {
  const [engine, setEngine]       = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedEx, setSelectedEx] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([getEngineStats(), getExercises()])
      .then(([eng, exs]) => {
        setEngine(eng.data);
        setExercises(exs.data);
        if (exs.data.length) setSelectedEx(exs.data[0].exercise_name);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEx) return;
    getExerciseHistory(selectedEx).then(r => {
      const byDate = {};
      for (const row of r.data) {
        const e1rm = Math.round(row.weight_lbs * (1 + row.reps / 30) * 10) / 10;
        if (!byDate[row.date] || e1rm > byDate[row.date].e1rm)
          byDate[row.date] = { date: row.date.slice(5), e1rm, weight: row.weight_lbs, reps: row.reps };
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

  const gainEntries   = Object.entries(engine.gains || {});
  const volumeData    = Object.entries(engine.volume || {}).map(([mg, vol]) => ({ mg, vol: Math.round(vol / 1000 * 10) / 10 })).sort((a, b) => b.vol - a.vol);
  const bestGain      = gainEntries.reduce((max, [, g]) => g.percentGain > (max?.percentGain ?? -Infinity) ? g : max, null);
  const totalVolume   = Object.values(engine.volume || {}).reduce((s, v) => s + v, 0);
  const histFirst     = history[0]?.e1rm;
  const histLast      = history[history.length - 1]?.e1rm;
  const histChange    = histFirst && histLast ? Math.round((histLast - histFirst) / histFirst * 1000) / 10 : null;

  return (
    <>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className={`stat-card ${engine.plateaus?.length ? '' : 'active-stat'}`}>
          <div className="stat-icon cyan">📈</div>
          <div className="stat-value cyan">{exercises.length}</div>
          <div className="stat-label">Exercises Tracked</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">🏆</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{bestGain ? `+${bestGain.percentGain}%` : '—'}</div>
          <div className="stat-label">Best Strength Gain</div>
        </div>

        <div className="stat-card" style={engine.plateaus?.length ? { borderColor: 'rgba(255,125,59,0.35)' } : {}}>
          <div className="stat-icon orange">⚡</div>
          <div className="stat-value" style={{ color: engine.plateaus?.length ? 'var(--orange)' : 'var(--text-primary)' }}>
            {engine.plateaus?.length || 0}
          </div>
          <div className="stat-label">Active Plateaus</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">🔥</div>
          <div className="stat-value">{totalVolume ? `${Math.round(totalVolume / 1000)}k` : '—'}</div>
          <div className="stat-label">This Week (lbs)</div>
        </div>
      </div>

      {/* Alerts */}
      {(engine.plateaus?.length > 0 || engine.deloadRecommended) && (
        <div className="card">
          <div className="card-header">
            <h2>Attention Required</h2>
            <span className="badge badge-orange">{(engine.plateaus?.length || 0) + (engine.deloadRecommended ? 1 : 0)} Alert{(engine.plateaus?.length || 0) + (engine.deloadRecommended ? 1 : 0) > 1 ? 's' : ''}</span>
          </div>
          {engine.plateaus?.map((p, i) => (
            <div key={i} className="alert alert-warn">
              <span>⚠️</span>
              <div>
                <div className="alert-title">{p.exercise} — Plateau Detected</div>
                <div className="alert-body">Stalled at {p.currentE1RM} lbs e1RM for {p.weeks} weeks. <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => onNavigate?.('AI Coach')}>Get a fix from AI Coach →</span></div>
              </div>
            </div>
          ))}
          {engine.deloadRecommended && (
            <div className="alert alert-info">
              <span>🔄</span>
              <div>
                <div className="alert-title">Deload Week Recommended</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.1rem' }}>4+ weeks of continuous training. Reduce volume by 40% this week for supercompensation.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Strength Curve */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header">
            <div>
              <h2>Strength Curve</h2>
              <div className="card-subtitle">Estimated 1RM over time</div>
            </div>
            {histChange !== null && (
              <span className={histChange >= 0 ? 'gain-positive' : 'gain-negative'} style={{ fontSize: '1rem' }}>
                {histChange >= 0 ? '▲' : '▼'} {Math.abs(histChange)}%
              </span>
            )}
          </div>

          <div className="muscle-tabs">
            {exercises.map(ex => (
              <button key={ex.exercise_name} type="button"
                className={`muscle-tab ${selectedEx === ex.exercise_name ? 'active' : ''}`}
                onClick={() => setSelectedEx(ex.exercise_name)}>
                {ex.exercise_name}
              </button>
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
                <Area type="monotone" dataKey="e1rm" stroke="#00d4e8" strokeWidth={2} fill="url(#cyanGrad)"
                  dot={{ r: 4, fill: '#00d4e8', stroke: '#0b1829', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#00d4e8' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem' }}>Log 2+ sessions to see the curve.</div>
          )}
        </div>

        {/* All-time Gains */}
        {gainEntries.length > 0 && (
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div>
                <h2>All-Time Gains</h2>
                <div className="card-subtitle">e1RM progress</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Exercise</th><th>Change</th><th>%</th></tr>
                </thead>
                <tbody>
                  {gainEntries.sort(([,a],[,b]) => b.percentGain - a.percentGain).map(([ex, g]) => (
                    <tr key={ex}>
                      <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{ex}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {g.firstE1RM}→<strong style={{ color: 'var(--text-secondary)' }}>{g.currentE1RM}</strong>
                      </td>
                      <td>
                        <span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>
                          {g.percentGain >= 0 ? '+' : ''}{g.percentGain}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Volume */}
      {volumeData.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2>Weekly Volume by Muscle Group</h2>
              <div className="card-subtitle">This week — in thousands of lbs</div>
            </div>
          </div>
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
                {volumeData.map((entry, i) => (
                  <Cell key={i} fill={MUSCLE_COLORS[entry.mg] || '#00d4e8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
}
