import { useState, useEffect } from 'react';
import { signIn, signUp, verifyEmail } from '../api';

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState('signin'); // 'signin' | 'signup' | 'verify'
  const [form, setForm]       = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Handle email verification link
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;
    verifyEmail(token)
      .then(() => { setMode('signin'); setSuccess('Email verified! You can now sign in.'); })
      .catch(err => setError(err.response?.data?.error || 'Verification failed'));
    window.history.replaceState({}, '', '/');
  }, []);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      if (mode === 'signin') {
        const r = await signIn({ email: form.email, password: form.password });
        localStorage.setItem('fiq_token', r.data.token);
        localStorage.setItem('fiq_user', JSON.stringify(r.data.user));
        onAuth(r.data.user);
      } else {
        await signUp({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined });
        setMode('verify');
        setSuccess(`Check your inbox at ${form.email} for a verification link.`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-900)', display: 'flex' }}>
      {/* Left branding panel */}
      <div style={{ flex: 1, background: 'var(--navy-800)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem', minWidth: 0 }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ width: 44, height: 44, background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>💪</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>FitnessIQ</span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '1rem' }}>
            Train smarter.<br />
            <span style={{ color: 'var(--cyan)' }}>Get stronger.</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
            FitnessIQ tracks your progressive overload, detects plateaus, and generates personalized training plans backed by real exercise science.
          </p>

          {[
            ['📈', 'Progressive Overload Engine', 'Automatically detects strength trends and plateaus'],
            ['🧠', 'AI-Powered Coaching', 'Claude generates grounded, specific plan adjustments'],
            ['📊', 'Live Progress Dashboard', 'Strength curves, volume heatmaps, and gain tracking'],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.1rem' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{ width: 440, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem 2.5rem', flexShrink: 0 }}>
        {mode === 'verify' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '0.75rem' }}>Check your inbox</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>{success}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No email?{' '}
              <span style={{ color: 'var(--cyan)', cursor: 'pointer' }} onClick={() => { setMode('signup'); setSuccess(''); }}>
                Try signing up again
              </span>
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {mode === 'signin' ? "Sign in to continue tracking your gains" : "Start your journey today"}
              </p>
            </div>

            {success && (
              <div style={{ background: 'rgba(0,224,122,0.1)', border: '1px solid rgba(0,224,122,0.25)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--green)', fontSize: '0.85rem' }}>
                ✓ {success}
              </div>
            )}
            {error && (
              <div style={{ background: 'rgba(255,77,106,0.1)', border: '1px solid rgba(255,77,106,0.25)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--red)', fontSize: '0.85rem' }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {mode === 'signup' && (
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" placeholder="Your name" value={form.name} onChange={set('name')} />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'} value={form.password} onChange={set('password')} required />
              </div>
              {mode === 'signup' && (
                <div className="form-group">
                  <label>Phone <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional — for workout reminders)</span></label>
                  <input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={set('phone')} />
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', justifyContent: 'center', padding: '0.75rem' }}>
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <span style={{ color: 'var(--cyan)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
