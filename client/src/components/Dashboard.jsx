import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { getEngineStats, getExercises, getExerciseHistory } from '../api';
import { MUSCLE_COLORS } from '../data/exercises';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e8e8ed', borderRadius: 10, padding: '0.75rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontSize: '0.78rem', color: '#6e6e80', marginBottom: '0.3rem' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 700, color: p.color || '#5b5ef4', fontSize: '0.95rem' }}>
          {p.value} {p.name === 'e1rm' ? 'lbs e1RM' : 'lbs'}
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [engine, setEngine] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [selectedEx, setSelectedEx] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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
        if (!byDate[row.date] || e1rm > byDate[row.date].e1rm) {
          byDate[row.date] = { date: row.date.slice(5), e1rm, weight: row.weight_lbs, reps: row.reps };
        }
      }
      setHistory(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    }).catch(() => {});
  }, [selectedEx]);

  if (loading) return <div className="loading">Loading your stats...</div>;

  if (!engine || !exercises.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🏋️</div>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No workouts yet</h3>
        <p>Head to <strong>Log Workout</strong> to record your first session and see your progress here.</p>
      </div>
    );
  }

  const gainEntries = Object.entries(engine.gains || {});
  const volumeData = Object.entries(engine.volume || {})
    .map(([mg, vol]) => ({ mg, vol: Math.round(vol / 1000 * 10) / 10 }))
    .sort((a, b) => b.vol - a.vol);
  const bestGain = gainEntries.reduce((max, [, g]) => g.percentGain > (max?.percentGain ?? -Infinity) ? g : max, null);
  const totalVolume = Object.values(engine.volume || {}).reduce((s, v) => s + v, 0);

  return (
    <>
      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent">📈</div>
          <div className="stat-value">{exercises.length}</div>
          <div className="stat-label">Exercises Tracked</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green">🏆</div>
          <div className="stat-value">{bestGain ? `+${bestGain.percentGain}%` : '—'}</div>
          <div className="stat-label">Best Strength Gain</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon orange">⚡</div>
          <div className="stat-value">{engine.plateaus?.length || 0}</div>
          <div className="stat-label">Active Plateaus</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon blue">🔥</div>
          <div className="stat-value">{totalVolume ? `${Math.round(totalVolume / 1000)}k` : '—'}</div>
          <div className="stat-label">This Week's Volume (lbs)</div>
        </div>
      </div>

      {/* Alerts */}
      {(engine.plateaus?.length > 0 || engine.deloadRecommended) && (
        <div className="card">
          <div className="card-header">
            <h2>Attention Needed</h2>
          </div>
          {engine.plateaus?.map((p, i) => (
            <div key={i} className="alert alert-warn">
              <div style={{ fontSize: '1.2rem' }}>⚠️</div>
              <div>
                <div className="alert-title">{p.exercise} — Plateau Detected</div>
                <div className="alert-body">Stalled at {p.currentE1RM} lbs e1RM for {p.weeks} consecutive weeks. Head to AI Coach for a personalized fix.</div>
              </div>
            </div>
          ))}
          {engine.deloadRecommended && (
            <div className="alert alert-info">
              <div style={{ fontSize: '1.2rem' }}>🔄</div>
              <div>
                <div className="alert-title">Deload Recommended</div>
                <div style={{ color: '#1d4ed8', fontSize: '0.85rem', marginTop: '0.1rem' }}>4+ weeks of continuous training. A deload week will boost recovery and help you come back stronger.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Strength Curve */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Strength Curve</h2>
            <div className="card-subtitle">Estimated 1RM over time</div>
          </div>
        </div>

        <div className="muscle-tabs" style={{ marginBottom: '1.25rem' }}>
          {exercises.map(ex => (
            <button
              key={ex.exercise_name}
              type="button"
              className={`muscle-tab ${selectedEx === ex.exercise_name ? 'active' : ''}`}
              onClick={() => setSelectedEx(ex.exercise_name)}
            >
              {ex.exercise_name}
            </button>
          ))}
        </div>

        {history.length > 1 ? (
          <>
            {history.length > 1 && (
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{history[0].e1rm} lbs</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent)' }}>{history[history.length - 1].e1rm} lbs</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Change</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }} className={history[history.length-1].e1rm >= history[0].e1rm ? 'gain-positive' : 'gain-negative'}>
                    {history[history.length-1].e1rm >= history[0].e1rm ? '+' : ''}
                    {Math.round((history[history.length-1].e1rm - history[0].e1rm) / history[0].e1rm * 1000) / 10}%
                  </div>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={history} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="e1rmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5b5ef4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#5b5ef4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a0a0b0' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#a0a0b0' }} width={55} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="e1rm" stroke="#5b5ef4" strokeWidth={2.5} fill="url(#e1rmGrad)" dot={{ r: 4, fill: '#5b5ef4', strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="empty-state" style={{ padding: '2rem' }}>Log 2+ sessions on this exercise to see the curve.</div>
        )}
      </div>

      {/* Volume + Gains side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Weekly Volume */}
        {volumeData.length > 0 && (
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div>
                <h2>Weekly Volume</h2>
                <div className="card-subtitle">This week, in thousands of lbs</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={volumeData} margin={{ top: 5, right: 5, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" horizontal={true} vertical={false} />
                <XAxis dataKey="mg" tick={{ fontSize: 10, fill: '#a0a0b0' }} angle={-30} textAnchor="end" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a0a0b0' }} width={35} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div style={{ background: 'white', border: '1px solid #e8e8ed', borderRadius: 10, padding: '0.6rem 0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '0.78rem', color: '#6e6e80' }}>{label}</div>
                    <div style={{ fontWeight: 700, color: '#1a1a2e' }}>{payload[0].value}k lbs</div>
                  </div>
                ) : null} />
                <Bar dataKey="vol" radius={[6, 6, 0, 0]}>
                  {volumeData.map((entry, i) => (
                    <Cell key={i} fill={MUSCLE_COLORS[entry.mg] || '#5b5ef4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Strength Gains Table */}
        {gainEntries.length > 0 && (
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div>
                <h2>All-Time Gains</h2>
                <div className="card-subtitle">Estimated 1RM progress</div>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Exercise</th>
                    <th>e1RM</th>
                    <th>Gain</th>
                  </tr>
                </thead>
                <tbody>
                  {gainEntries
                    .sort(([, a], [, b]) => b.percentGain - a.percentGain)
                    .map(([ex, g]) => (
                    <tr key={ex}>
                      <td style={{ fontWeight: 500 }}>{ex}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.firstE1RM}→</span> {g.currentE1RM}
                      </td>
                      <td>
                        <span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>
                          {g.percentGain >= 0 ? '▲' : '▼'} {Math.abs(g.percentGain)}%
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
    </>
  );
}
