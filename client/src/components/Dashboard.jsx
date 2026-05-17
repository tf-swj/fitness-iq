import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts';
import { getEngineStats, getExercises, getExerciseHistory } from '../api';

const MUSCLE_COLORS = {
  Chest: '#7c6fff', Back: '#ff6b9d', Shoulders: '#ffa040',
  Biceps: '#40c070', Triceps: '#4090ff', Quads: '#ff4060',
  Hamstrings: '#c060ff', Glutes: '#60d0ff', Calves: '#ffdd40', Core: '#80ff80',
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedEx) return;
    getExerciseHistory(selectedEx).then(r => {
      // Group by date, pick best e1rm per day
      const byDate = {};
      for (const row of r.data) {
        const e1rm = Math.round(row.weight_lbs * (1 + row.reps / 30) * 10) / 10;
        if (!byDate[row.date] || e1rm > byDate[row.date].e1rm) {
          byDate[row.date] = { date: row.date, e1rm, weight: row.weight_lbs, reps: row.reps };
        }
      }
      setHistory(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    }).catch(() => {});
  }, [selectedEx]);

  if (loading) return <div className="loading">Loading your stats...</div>;

  if (!engine || !exercises.length) {
    return (
      <div className="empty-state">
        No workouts logged yet.<br />Head to "Log Workout" to get started and see your progress here.
      </div>
    );
  }

  const gainEntries = Object.entries(engine.gains || {});
  const volumeData = Object.entries(engine.volume || {}).map(([mg, vol]) => ({ mg, vol: Math.round(vol) }));
  const totalSessions = engine.trends ? Object.values(engine.trends)[0]?.length || 0 : 0;
  const bestGain = gainEntries.reduce((max, [, g]) => g.percentGain > (max?.percentGain ?? -Infinity) ? g : max, null);

  return (
    <>
      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{exercises.length}</div>
          <div className="stat-label">Exercises Tracked</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{engine.plateaus?.length || 0}</div>
          <div className="stat-label">Plateaus</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{bestGain ? `+${bestGain.percentGain}%` : '—'}</div>
          <div className="stat-label">Best Strength Gain</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{engine.deloadRecommended ? 'Yes' : 'No'}</div>
          <div className="stat-label">Deload Needed</div>
        </div>
      </div>

      {/* Plateau alerts */}
      {engine.plateaus?.length > 0 && (
        <div className="card">
          <h2>Plateau Alerts</h2>
          {engine.plateaus.map((p, i) => (
            <div key={i} className="plateau-alert">
              <span className="badge badge-warn">STALLED</span>
              <span><strong>{p.exercise}</strong> — stuck at {p.currentE1RM} lbs e1RM for {p.weeks} weeks</span>
            </div>
          ))}
        </div>
      )}

      {/* Strength curve */}
      <div className="card">
        <h2>Strength Curve (Estimated 1RM over time)</h2>
        <div className="exercise-select-list">
          {exercises.map(ex => (
            <span
              key={ex.exercise_name}
              className={`ex-chip ${selectedEx === ex.exercise_name ? 'selected' : ''}`}
              onClick={() => setSelectedEx(ex.exercise_name)}
            >
              {ex.exercise_name}
            </span>
          ))}
        </div>
        {history.length > 1 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#666' }} />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} width={50} />
              <Tooltip
                contentStyle={{ background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 8, color: '#e8e8f0' }}
                formatter={(v) => [`${v} lbs`, 'e1RM']}
              />
              <Line type="monotone" dataKey="e1rm" stroke="#7c6fff" strokeWidth={2} dot={{ r: 4, fill: '#7c6fff' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="empty-state" style={{ padding: '1.5rem' }}>Log 2+ sessions to see the curve.</div>
        )}
      </div>

      {/* Weekly volume */}
      {volumeData.length > 0 && (
        <div className="card">
          <h2>Weekly Volume by Muscle Group (this week)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <XAxis dataKey="mg" tick={{ fontSize: 11, fill: '#666' }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#666' }} width={60} />
              <Tooltip
                contentStyle={{ background: '#1e1e2a', border: '1px solid #2a2a3a', borderRadius: 8, color: '#e8e8f0' }}
                formatter={(v) => [`${v.toLocaleString()} lbs`, 'Volume']}
              />
              <Bar dataKey="vol" radius={[4, 4, 0, 0]}>
                {volumeData.map((entry, i) => (
                  <Cell key={i} fill={MUSCLE_COLORS[entry.mg] || '#7c6fff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Strength gains table */}
      {gainEntries.length > 0 && (
        <div className="card">
          <h2>Strength Gains Summary</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Exercise</th>
                  <th>Starting e1RM</th>
                  <th>Current e1RM</th>
                  <th>Gain</th>
                  <th>Weeks</th>
                </tr>
              </thead>
              <tbody>
                {gainEntries.map(([ex, g]) => (
                  <tr key={ex}>
                    <td>{ex}</td>
                    <td>{g.firstE1RM} lbs</td>
                    <td>{g.currentE1RM} lbs</td>
                    <td>
                      <span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>
                        {g.percentGain >= 0 ? '+' : ''}{g.percentGain}%
                      </span>
                    </td>
                    <td>{g.weeksTracked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
