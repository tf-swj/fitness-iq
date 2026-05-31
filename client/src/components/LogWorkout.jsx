import { useState } from 'react';
import { logWorkout } from '../api';
import { EXERCISE_DB, MUSCLE_GROUPS, MUSCLE_EMOJIS, searchExercises } from '../data/exercises';
import { WeightChip } from './PlateCalculator';

function emptySet(n) { return { set_number: n, reps: '', weight_lbs: '' }; }
function emptyExercise() { return { exercise_name: '', muscle_group: 'Chest', sets: [emptySet(1)], showPicker: true, search: '' }; }

export default function LogWorkout({ onLogged }) {
  const [date, setDate]           = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes]         = useState('');
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [pickerMuscle, setPickerMuscle] = useState({});
  const [aiFeedback, setAiFeedback] = useState(null);

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

  const pickExercise = (ei, name, muscle) =>
    setExercises(exs => exs.map((ex, i) =>
      i === ei ? { ...ex, exercise_name: name, muscle_group: muscle, showPicker: false, search: '' } : ex
    ));

  const addExercise = () => setExercises(exs => [...exs, emptyExercise()]);
  const removeExercise = (ei) => setExercises(exs => exs.filter((_, i) => i !== ei));

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError('');
    const allSets = [];
    for (const ex of exercises) {
      if (!ex.exercise_name.trim()) { setError('All exercises need a name'); return; }
      for (const s of ex.sets) {
        if (!s.reps || !s.weight_lbs) { setError('Fill in reps and weight for every set'); return; }
        allSets.push({ exercise_name: ex.exercise_name.trim(), muscle_group: ex.muscle_group, set_number: s.set_number, reps: Number(s.reps), weight_lbs: Number(s.weight_lbs) });
      }
    }
    setLoading(true);
    try {
      const r = await logWorkout({ date, notes, sets: allSets, getAiFeedback: true });
      if (r.data.aiFeedback) {
        setAiFeedback(r.data.aiFeedback);
        setTimeout(() => onLogged(), 4000);
      } else {
        onLogged();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log workout');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <div className="card-header"><h2>Session Details</h2></div>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input type="text" placeholder="e.g. felt strong, PR attempt" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {exercises.map((ex, ei) => {
        const muscle = pickerMuscle[ei] || ex.muscle_group || 'Chest';
        const searchResults = ex.search.trim() ? searchExercises(ex.search) : null;

        return (
          <div key={ei} className="exercise-block">
            <div className="exercise-block-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="exercise-number">{ei + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {ex.exercise_name || <span style={{ color: 'var(--text-muted)' }}>Select an exercise</span>}
                  </div>
                  {ex.exercise_name && <div style={{ fontSize: '0.72rem', color: 'var(--cyan)', marginTop: '0.1rem' }}>{ex.muscle_group}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" onClick={() => updateExercise(ei, 'showPicker', !ex.showPicker)}>
                  {ex.showPicker ? 'Collapse' : 'Change'}
                </button>
                {exercises.length > 1 && <button type="button" className="btn-danger" onClick={() => removeExercise(ei)}>Remove</button>}
              </div>
            </div>

            {ex.showPicker && (
              <div className="picker-panel">
                {/* Search bar */}
                <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                  <label>Search exercises</label>
                  <input
                    type="text"
                    placeholder="Type to search 300+ exercises..."
                    value={ex.search}
                    onChange={e => updateExercise(ei, 'search', e.target.value)}
                    autoComplete="off"
                  />
                </div>

                {/* Search results */}
                {searchResults ? (
                  searchResults.length > 0 ? (
                    <>
                      <div className="form-section-title">Search Results</div>
                      <div className="ex-grid">
                        {searchResults.map(({ name, muscle: mg }) => (
                          <button key={name} type="button"
                            className={`ex-chip ${ex.exercise_name === name ? 'selected' : ''}`}
                            onClick={() => pickExercise(ei, name, mg)}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.1rem' }}>{mg}</span>
                            {name}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.5rem 0 0.75rem' }}>
                      No results. Try a different name or browse below.
                    </div>
                  )
                ) : (
                  <>
                    {/* Muscle group tabs */}
                    <div className="form-section-title">Browse by Muscle</div>
                    <div className="muscle-tabs">
                      {MUSCLE_GROUPS.map(mg => (
                        <button key={mg} type="button"
                          className={`muscle-tab ${muscle === mg ? 'active' : ''}`}
                          onClick={() => setPickerMuscle(p => ({ ...p, [ei]: mg }))}>
                          {MUSCLE_EMOJIS[mg]} {mg}
                        </button>
                      ))}
                    </div>
                    <div className="form-section-title">Exercises</div>
                    <div className="ex-grid">
                      {(EXERCISE_DB[muscle] || []).map(name => (
                        <button key={name} type="button"
                          className={`ex-chip ${ex.exercise_name === name ? 'selected' : ''}`}
                          onClick={() => pickExercise(ei, name, muscle)}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Custom name input */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>Custom:</span>
                  <input type="text" style={{ maxWidth: 300 }} placeholder="Type any exercise name..."
                    value={ex.exercise_name}
                    onChange={e => updateExercise(ei, 'exercise_name', e.target.value)} />
                </div>
              </div>
            )}

            {/* Sets table */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Set</th><th>Reps</th><th>Weight (lbs)</th><th></th></tr>
                </thead>
                <tbody>
                  {ex.sets.map((s, si) => (
                    <tr key={si}>
                      <td style={{ color: 'var(--cyan)', fontWeight: 700 }}>{s.set_number}</td>
                      <td><input type="number" className="set-input" min="1" value={s.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)} placeholder="8" /></td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input type="number" className="set-input" style={{ width: 80 }} min="0" step="2.5" value={s.weight_lbs} onChange={e => updateSet(ei, si, 'weight_lbs', e.target.value)} placeholder="135" />
                        {s.weight_lbs > 0 && <WeightChip weight={Number(s.weight_lbs)} />}
                      </td>
                      <td>{ex.sets.length > 1 && <button type="button" className="btn-danger" onClick={() => removeSet(ei, si)}>✕</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" className="btn-ghost" style={{ marginTop: '0.75rem' }} onClick={() => addSet(ei)}>+ Add Set</button>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <button type="button" className="btn-secondary" onClick={addExercise}>+ Add Exercise</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : '✓ Save Workout'}
        </button>
        {error && <span className="error-msg">⚠ {error}</span>}
      </div>

      {/* AI post-workout feedback */}
      {aiFeedback && (
        <div style={{ marginTop: '1.25rem', background: 'linear-gradient(135deg, var(--navy-800), #0d2a3a)', border: '1px solid var(--cyan-border)', borderRadius: 14, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: 'var(--cyan-glow)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>◈</div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.4rem' }}>Alex · Post-Workout Feedback</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{aiFeedback}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Returning to dashboard in a moment...</div>
          </div>
        </div>
      )}
    </form>
  );
}
