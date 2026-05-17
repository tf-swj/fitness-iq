import { useState } from 'react';
import { logWorkout } from '../api';
import { EXERCISE_DB, MUSCLE_GROUPS, MUSCLE_EMOJIS } from '../data/exercises';

function emptySet(n) {
  return { set_number: n, reps: '', weight_lbs: '', rpe: '' };
}

function emptyExercise() {
  return { exercise_name: '', muscle_group: 'Chest', sets: [emptySet(1)], showPicker: true };
}

export default function LogWorkout({ onLogged }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState({});

  const updateExercise = (ei, field, value) =>
    setExercises(exs => exs.map((ex, i) => i === ei ? { ...ex, [field]: value } : ex));

  const updateSet = (ei, si, field, value) =>
    setExercises(exs => exs.map((ex, i) => {
      if (i !== ei) return ex;
      return { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) };
    }));

  const addSet = (ei) =>
    setExercises(exs => exs.map((ex, i) => {
      if (i !== ei) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { ...last, set_number: ex.sets.length + 1 }] };
    }));

  const removeSet = (ei, si) =>
    setExercises(exs => exs.map((ex, i) => {
      if (i !== ei) return ex;
      const sets = ex.sets.filter((_, j) => j !== si).map((s, j) => ({ ...s, set_number: j + 1 }));
      return { ...ex, sets };
    }));

  const pickExercise = (ei, name, muscle) => {
    setExercises(exs => exs.map((ex, i) =>
      i === ei ? { ...ex, exercise_name: name, muscle_group: muscle, showPicker: false } : ex
    ));
  };

  const addExercise = () => setExercises(exs => [...exs, emptyExercise()]);
  const removeExercise = (ei) => setExercises(exs => exs.filter((_, i) => i !== ei));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const allSets = [];
    for (const ex of exercises) {
      if (!ex.exercise_name.trim()) { setError('All exercises need a name'); return; }
      for (const s of ex.sets) {
        if (!s.reps || !s.weight_lbs) { setError('Fill in reps and weight for all sets'); return; }
        allSets.push({
          exercise_name: ex.exercise_name.trim(),
          muscle_group: ex.muscle_group,
          set_number: s.set_number,
          reps: Number(s.reps),
          weight_lbs: Number(s.weight_lbs),
          rpe: s.rpe ? Number(s.rpe) : null,
        });
      }
    }
    setLoading(true);
    try {
      await logWorkout({ date, notes, sets: allSets });
      onLogged();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log workout');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Log Workout</h2>
            <div className="card-subtitle">Track your sets, reps, and weight</div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Session Notes</label>
            <input type="text" placeholder="e.g. felt strong, good energy" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Exercises */}
      {exercises.map((ex, ei) => {
        const muscle = pickerMuscle[ei] || ex.muscle_group || 'Chest';
        return (
          <div key={ei} className="exercise-block">
            <div className="exercise-block-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="exercise-number">{ei + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {ex.exercise_name || 'Pick an exercise'}
                  </div>
                  {ex.exercise_name && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {ex.muscle_group}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.75rem' }}
                  onClick={() => updateExercise(ei, 'showPicker', !ex.showPicker)}>
                  {ex.showPicker ? 'Hide' : 'Change'}
                </button>
                {exercises.length > 1 && (
                  <button type="button" className="btn-danger" onClick={() => removeExercise(ei)}>Remove</button>
                )}
              </div>
            </div>

            {/* Exercise picker */}
            {ex.showPicker && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div className="form-section-title" style={{ marginBottom: '0.6rem' }}>Select Muscle Group</div>
                <div className="muscle-tabs">
                  {MUSCLE_GROUPS.map(mg => (
                    <button
                      key={mg}
                      type="button"
                      className={`muscle-tab ${muscle === mg ? 'active' : ''}`}
                      onClick={() => setPickerMuscle(p => ({ ...p, [ei]: mg }))}
                    >
                      {MUSCLE_EMOJIS[mg]} {mg}
                    </button>
                  ))}
                </div>
                <div className="form-section-title" style={{ marginBottom: '0.6rem' }}>Exercises</div>
                <div className="ex-grid">
                  {(EXERCISE_DB[muscle] || []).map(name => (
                    <button
                      key={name}
                      type="button"
                      className={`ex-chip ${ex.exercise_name === name ? 'selected' : ''}`}
                      onClick={() => pickExercise(ei, name, muscle)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Or type custom:</span>
                  <input
                    type="text"
                    style={{ flex: 1, maxWidth: 260 }}
                    placeholder="Custom exercise name..."
                    value={ex.exercise_name}
                    onChange={e => updateExercise(ei, 'exercise_name', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Sets */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Set</th>
                    <th>Reps</th>
                    <th>Weight (lbs)</th>
                    <th>RPE</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {ex.sets.map((s, si) => (
                    <tr key={si}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{s.set_number}</td>
                      <td><input type="number" className="set-input" min="1" value={s.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)} placeholder="8" /></td>
                      <td><input type="number" className="set-input" style={{ width: 90 }} min="0" step="2.5" value={s.weight_lbs} onChange={e => updateSet(ei, si, 'weight_lbs', e.target.value)} placeholder="135" /></td>
                      <td><input type="number" className="set-input" min="1" max="10" value={s.rpe} onChange={e => updateSet(ei, si, 'rpe', e.target.value)} placeholder="—" /></td>
                      <td>{ex.sets.length > 1 && <button type="button" className="btn-danger" onClick={() => removeSet(ei, si)}>✕</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn-ghost" style={{ marginTop: '0.75rem', fontSize: '0.82rem' }} onClick={() => addSet(ei)}>
              + Add Set
            </button>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn-secondary" onClick={addExercise}>+ Add Exercise</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : '✓ Save Workout'}
        </button>
        {error && <span className="error-msg">⚠ {error}</span>}
      </div>
    </form>
  );
}
