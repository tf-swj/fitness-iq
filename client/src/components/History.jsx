import { useEffect, useState } from 'react';
import { getHistory, getPRs } from '../api';
import { WeightChip } from './PlateCalculator';

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [prs, setPRs]           = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getHistory(), getPRs()])
      .then(([h, p]) => {
        setSessions(h.data);
        const prMap = {};
        p.data.forEach(pr => { prMap[pr.exercise] = pr.e1rm; });
        setPRs(prMap);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  if (loading) return <div className="loading">Loading history...</div>;
  if (!sessions.length) return (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No sessions yet</h3>
      <p>Log your first workout to see your history here.</p>
    </div>
  );

  return (
    <>
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <div><h2>Workout History</h2><div className="card-subtitle">{sessions.length} sessions logged</div></div>
        </div>
      </div>

      {sessions.map(session => {
        const isOpen = expanded[session.id];
        // Group sets by exercise
        const byEx = {};
        for (const s of session.sets) {
          if (!byEx[s.exercise_name]) byEx[s.exercise_name] = { muscle: s.muscle_group, sets: [] };
          byEx[s.exercise_name].sets.push(s);
        }
        const exercises = Object.entries(byEx);
        const hasPR = exercises.some(([name]) => prs[name]);
        const totalSets = session.sets.length;
        const muscles = [...new Set(exercises.map(([, v]) => v.muscle))];

        return (
          <div key={session.id} className="card" style={{ marginBottom: '0.75rem', cursor: 'pointer' }} onClick={() => toggle(session.id)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ minWidth: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cyan)' }}>
                    {new Date(session.date + 'T00:00:00').getDate()}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {new Date(session.date + 'T00:00:00').toLocaleString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {exercises.map(([name]) => name).join(', ').slice(0, 60)}{exercises.length > 3 ? '...' : ''}
                    </span>
                    {hasPR && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>🏆 PR</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{totalSets} sets</span>
                    {muscles.slice(0, 3).map(m => (
                      <span key={m} style={{ fontSize: '0.68rem', color: 'var(--cyan)', background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 10, padding: '0.05rem 0.45rem' }}>{m}</span>
                    ))}
                  </div>
                  {session.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontStyle: 'italic' }}>"{session.notes}"</div>}
                </div>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
            </div>

            {isOpen && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }} onClick={e => e.stopPropagation()}>
                {exercises.map(([name, { sets }]) => {
                  const isPR = !!prs[name];
                  const bestE1RM = Math.max(...sets.map(s => s.weight_lbs * (1 + s.reps / 30)));
                  return (
                    <div key={name} style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{name}</span>
                        {isPR && <span style={{ fontSize: '0.7rem', background: 'rgba(0,212,232,0.15)', color: 'var(--cyan)', border: '1px solid var(--cyan-border)', borderRadius: 10, padding: '0.1rem 0.5rem', fontWeight: 700 }}>🏆 PR — {Math.round(bestE1RM * 10) / 10} lbs e1RM</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {sets.map((s, i) => (
                          <div key={i} style={{ background: 'var(--navy-700)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Set {s.set_number} · </span>
                            {s.reps} × <WeightChip weight={s.weight_lbs} /> lbs
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
