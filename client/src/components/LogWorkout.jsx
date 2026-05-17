import { useState } from 'react';
import { logWorkout } from '../api';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

const PRESET_EXERCISES = {
  Chest: ['Bench Press', 'Incline Bench Press', 'Dumbbell Fly', 'Push-Up'],
  Back: ['Deadlift', 'Barbell Row', 'Pull-Up', 'Lat Pulldown', 'Cable Row'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Arnold Press'],
  Biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl'],
  Triceps: ['Tricep Pushdown', 'Skull Crusher', 'Close-Grip Bench', 'Dips'],
  Quads: ['Squat', 'Leg Press', 'Hack Squat', 'Leg Extension', 'Lunge'],
  Hamstrings: ['Romanian Deadlift', 'Leg Curl', 'Good Morning', 'Nordic Curl'],
  Glutes: ['Hip Thrust', 'Bulgarian Split Squat', 'Glute Bridge', 'Sumo Deadlift'],
  Calves: ['Standing Calf Raise', 'Seated Calf Raise'],
  Core: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Ab Wheel'],
};

function emptySet() {
  return { set_number: 1, reps: '', weight_lbs: '', rpe: '' };
}

function emptyExercise() {
  return { exercise_name: '', muscle_group: 'Chest', sets: [emptySet()] };
}

export default function LogWorkout({ onLogged }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState([emptyExercise()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateExercise = (ei, field, value) => {
    setExercises(exs => exs.map((ex, i) => i === ei ? { ...ex, [field]: value } : ex));
  };

  const updateSet = (ei, si, field, value) => {
    setExercises(exs => exs.map((ex, i) => {
      if (i !== ei) return ex;
      return { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) };
    }));
  };

  const addSet = (ei) => {
    setExercises(exs => exs.map((ex, i) => {
      if (i !== ei) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return { ...ex, sets: [...ex.sets, { ...last, set_number: ex.sets.length + 1 }] };
    }));
  };

  const removeSet = (ei, si) => {
    setExercises(exs => exs.map((ex, i) => {
      if (i !== ei) return ex;
      const sets = ex.sets.filter((_, j) => j !== si).map((s, j) => ({ ...s, set_number: j + 1 }));
      return { ...ex, sets };
    }));
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="card">
        <h2>Log Workout</h2>
        <div className="form-row">
          <div>
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label>Notes (optional)</label>
            <input type="text" placeholder="e.g. felt strong today" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
      </div>

      {exercises.map((ex, ei) => (
        <div key={ei} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h2>Exercise {ei + 1}</h2>
            {exercises.length > 1 && (
              <button type="button" className="btn-danger" onClick={() => removeExercise(ei)}>Remove</button>
            )}
          </div>

          <div className="form-row">
            <div>
              <label>Muscle Group</label>
              <select value={ex.muscle_group} onChange={e => updateExercise(ei, 'muscle_group', e.target.value)}>
                {MUSCLE_GROUPS.map(mg => <option key={mg}>{mg}</option>)}
              </select>
            </div>
            <div>
              <label>Exercise Name</label>
              <input
                type="text"
                list={`ex-presets-${ei}`}
                placeholder="e.g. Bench Press"
                value={ex.exercise_name}
                onChange={e => updateExercise(ei, 'exercise_name', e.target.value)}
              />
              <datalist id={`ex-presets-${ei}`}>
                {(PRESET_EXERCISES[ex.muscle_group] || []).map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>

          <div className="section-title">Sets</div>
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
                    <td>{s.set_number}</td>
                    <td><input type="number" min="1" style={{ width: '70px' }} value={s.reps} onChange={e => updateSet(ei, si, 'reps', e.target.value)} /></td>
                    <td><input type="number" min="0" step="2.5" style={{ width: '90px' }} value={s.weight_lbs} onChange={e => updateSet(ei, si, 'weight_lbs', e.target.value)} /></td>
                    <td><input type="number" min="1" max="10" style={{ width: '60px' }} placeholder="—" value={s.rpe} onChange={e => updateSet(ei, si, 'rpe', e.target.value)} /></td>
                    <td>{ex.sets.length > 1 && <button type="button" className="btn-danger" onClick={() => removeSet(ei, si)}>✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="btn-ghost" style={{ marginTop: '0.75rem' }} onClick={() => addSet(ei)}>+ Add Set</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button type="button" className="btn-ghost" onClick={addExercise}>+ Add Exercise</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Workout'}
        </button>
        {error && <span className="error-msg">{error}</span>}
      </div>
    </form>
  );
}
