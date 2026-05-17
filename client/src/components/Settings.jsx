import { useState } from 'react';
import { updateProfile } from '../api';

export default function Settings({ user, onUpdate }) {
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setSaved(false); setError('');
    try {
      const r = await updateProfile(form);
      onUpdate(r.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const initials = (user?.name || user?.email || 'A').slice(0, 2).toUpperCase();
  const joinDate = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';

  return (
    <>
      {/* Profile card */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--cyan), #0099aa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 800, color: 'var(--navy-900)', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name || 'Athlete'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{user?.email}</div>
            <div style={{ marginTop: '0.5rem' }}>
              <span className="badge badge-green">● Verified</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1rem', background: 'var(--navy-800)', borderRadius: 10, border: '1px solid var(--border)' }}>
          {[
            ['Member since', joinDate],
            ['Status', 'Active'],
            ['Plan', 'Free Tier'],
          ].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{label}</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem', fontSize: '0.9rem' }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit profile */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2>Edit Profile</h2>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label>Display Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: '0.72rem' }}>for workout reminders</span></label>
              <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Saved</span>}
            {error && <span className="error-msg">⚠ {error}</span>}
          </div>
        </form>
      </div>

      {/* Notifications info */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-header">
          <h2>Notifications</h2>
          <span className="badge badge-orange">Coming Soon</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[
            ['📱', 'SMS Workout Reminders', 'Get a text when it\'s time to hit the gym based on your recovery windows', !!user?.phone],
            ['📧', 'Weekly Progress Email', 'Receive a weekly summary of your strength gains and volume', true],
            ['⚡', 'Plateau Alerts', 'Instant notification when the engine detects a stalled lift', true],
          ].map(([icon, title, desc, enabled]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'var(--navy-800)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.1rem' }}>{desc}</div>
                </div>
              </div>
              <div style={{ width: 36, height: 20, background: enabled ? 'var(--cyan-dim)' : 'var(--navy-700)', borderRadius: 10, border: `1px solid ${enabled ? 'var(--cyan-border)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', padding: '2px', cursor: 'not-allowed' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: enabled ? 'var(--cyan)' : 'var(--navy-500)', marginLeft: enabled ? 'auto' : 0, transition: 'all 0.2s' }} />
              </div>
            </div>
          ))}
        </div>
        {!user?.phone && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.75rem' }}>Add your phone number above to enable SMS reminders.</p>
        )}
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: 'rgba(255,77,106,0.2)' }}>
        <div className="card-header">
          <h2 style={{ color: 'var(--red)' }}>Danger Zone</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(255,77,106,0.05)', borderRadius: 10, border: '1px solid rgba(255,77,106,0.15)' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Sign Out</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>You'll need to sign back in to access your data</div>
          </div>
          <button className="btn-danger" onClick={() => {
            localStorage.removeItem('fiq_token');
            localStorage.removeItem('fiq_user');
            window.location.reload();
          }}>Sign Out</button>
        </div>
      </div>
    </>
  );
}
