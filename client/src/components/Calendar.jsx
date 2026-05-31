import { useEffect, useState } from 'react';
import { getSchedule, saveScheduleDay, deleteScheduleDay } from '../api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const PRESETS = [
  { label: 'Push', color: '#5b5ef4' },
  { label: 'Pull', color: '#00d4e8' },
  { label: 'Legs', color: '#22c55e' },
  { label: 'Upper Body', color: '#f97316' },
  { label: 'Lower Body', color: '#a855f7' },
  { label: 'Chest & Triceps', color: '#5b5ef4' },
  { label: 'Back & Biceps', color: '#00d4e8' },
  { label: 'Shoulders', color: '#fbbf24' },
  { label: 'Arms', color: '#ec4899' },
  { label: 'Cardio', color: '#06b6d4' },
  { label: 'Full Body', color: '#84cc16' },
  { label: 'Core', color: '#14b8a6' },
  { label: 'Rest', color: '#4a6a82' },
  { label: 'Active Recovery', color: '#4a6a82' },
];

const COLORS = ['#5b5ef4','#00d4e8','#22c55e','#f97316','#a855f7','#fbbf24','#ec4899','#06b6d4','#84cc16','#14b8a6','#ef4444','#4a6a82'];

export default function Calendar() {
  const [schedule, setSchedule] = useState({});
  const [editing, setEditing]   = useState(null); // dayIndex being edited
  const [form, setForm]         = useState({ label: '', color: '#00d4e8', notes: '' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    getSchedule().then(r => {
      const map = {};
      r.data.forEach(d => { map[d.day_index] = d; });
      setSchedule(map);
    });
  }, []);

  const openEdit = (dayIndex) => {
    const existing = schedule[dayIndex];
    setForm({ label: existing?.label || '', color: existing?.color || '#00d4e8', notes: existing?.notes || '' });
    setEditing(dayIndex);
  };

  const handleSave = async () => {
    if (!form.label.trim()) return;
    setSaving(true);
    await saveScheduleDay(editing, form);
    setSchedule(s => ({ ...s, [editing]: { day_index: editing, ...form } }));
    setEditing(null);
    setSaving(false);
  };

  const handleClear = async (dayIndex) => {
    await deleteScheduleDay(dayIndex);
    setSchedule(s => { const n = { ...s }; delete n[dayIndex]; return n; });
    setEditing(null);
  };

  const today = new Date().getDay(); // 0=Sun
  const todayIndex = today === 0 ? 6 : today - 1; // convert to Mon=0

  return (
    <>
      {/* Weekly view */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <div><h2>Weekly Training Schedule</h2><div className="card-subtitle">Plan your training split for the week</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
          {DAYS.map((day, i) => {
            const entry = schedule[i];
            const isToday = i === todayIndex;
            const isRest = entry?.label?.toLowerCase().includes('rest');

            return (
              <div
                key={i}
                onClick={() => openEdit(i)}
                style={{
                  borderRadius: 12,
                  border: isToday ? `2px solid ${entry?.color || 'var(--cyan)'}` : '1px solid var(--border)',
                  background: entry ? `${entry.color}18` : 'var(--navy-700)',
                  padding: '1rem 0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'center',
                  position: 'relative',
                  boxShadow: isToday ? `0 0 16px ${entry?.color || 'var(--cyan)'}33` : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = entry?.color || 'var(--cyan)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = isToday ? (entry?.color || 'var(--cyan)') : 'var(--border)'}
              >
                {isToday && (
                  <div style={{ position: 'absolute', top: 6, right: 8, width: 6, height: 6, borderRadius: '50%', background: entry?.color || 'var(--cyan)' }} />
                )}
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
                  {day.slice(0, 3)}
                </div>
                {entry ? (
                  <>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>
                      {isRest ? '😴' : getWorkoutEmoji(entry.label)}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: entry.color, lineHeight: 1.3 }}>{entry.label}</div>
                    {entry.notes && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.4 }}>{entry.notes}</div>}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.3rem', marginBottom: '0.35rem', opacity: 0.3 }}>+</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Add day</div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's focus */}
      {schedule[todayIndex] && (
        <div className="card accent-border" style={{ background: 'linear-gradient(135deg, var(--navy-800), #0d2a3a)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${schedule[todayIndex].color}22`, border: `1px solid ${schedule[todayIndex].color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
              {getWorkoutEmoji(schedule[todayIndex].label)}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Today · {DAYS[todayIndex]}</div>
              <div style={{ fontWeight: 700, color: schedule[todayIndex].color, fontSize: '1.1rem', marginTop: '0.1rem' }}>{schedule[todayIndex].label}</div>
              {schedule[todayIndex].notes && <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.2rem' }}>{schedule[todayIndex].notes}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Quick presets */}
      <div className="card">
        <div className="card-header"><h2>Quick Presets</h2><div className="card-subtitle">Click a day in the calendar above, then pick a preset</div></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {PRESETS.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', background: `${p.color}18`, border: `1px solid ${p.color}40`, borderRadius: 20, fontSize: '0.8rem', fontWeight: 600, color: p.color }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              {p.label}
            </div>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editing !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }} onClick={() => setEditing(null)}>
          <div style={{ background: 'var(--navy-800)', border: '1px solid var(--border-bright)', borderRadius: 16, padding: '1.75rem', width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>{DAYS[editing]}</h2>

            {/* Presets */}
            <div className="form-section-title">Quick Select</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {PRESETS.map(p => (
                <button key={p.label} type="button"
                  style={{ padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, border: `1px solid ${p.color}55`, background: form.label === p.label ? `${p.color}30` : `${p.color}12`, color: p.color, cursor: 'pointer' }}
                  onClick={() => setForm(f => ({ ...f, label: p.label, color: p.color }))}>
                  {p.label}
                </button>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label>Custom Label</label>
              <input type="text" placeholder="e.g. Push Day, Cardio, Rest" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
            </div>

            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label>Notes</label>
              <input type="text" placeholder="e.g. Bench + OHP + Dips" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label>Color</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                    style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '2px solid white' : '2px solid transparent', transition: 'border 0.1s' }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" disabled={!form.label.trim() || saving} onClick={handleSave} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              {schedule[editing] && (
                <button className="btn-danger" onClick={() => handleClear(editing)}>Clear Day</button>
              )}
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getWorkoutEmoji(label = '') {
  const l = label.toLowerCase();
  if (l.includes('rest')) return '😴';
  if (l.includes('push')) return '🤜';
  if (l.includes('pull')) return '🤛';
  if (l.includes('leg')) return '🦵';
  if (l.includes('chest')) return '💪';
  if (l.includes('back')) return '🔙';
  if (l.includes('shoulder')) return '🏋️';
  if (l.includes('arm') || l.includes('bicep') || l.includes('tricep')) return '💪';
  if (l.includes('cardio') || l.includes('run')) return '🏃';
  if (l.includes('core') || l.includes('abs')) return '🧱';
  if (l.includes('full')) return '⚡';
  if (l.includes('upper')) return '👆';
  if (l.includes('lower')) return '👇';
  if (l.includes('recovery')) return '🧘';
  return '🏋️';
}
