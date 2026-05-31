import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import LogWorkout from './components/LogWorkout';
import AICoach from './components/AICoach';
import Calendar from './components/Calendar';
import History from './components/History';
import Settings from './components/Settings';
import RestTimer from './components/RestTimer';
import './App.css';

const NAV = [
  { id: 'Dashboard',   icon: '▦', label: 'Dashboard' },
  { id: 'Log Workout', icon: '+', label: 'Log Workout' },
  { id: 'Calendar',    icon: '◫', label: 'Calendar' },
  { id: 'History',     icon: '◷', label: 'History' },
  { id: 'AI Coach',    icon: '◈', label: 'AI Coach' },
];

const PAGE_META = {
  'Dashboard':   { title: 'Dashboard',    subtitle: 'Your training overview' },
  'Log Workout': { title: 'Log Workout',  subtitle: 'Record your session' },
  'Calendar':    { title: 'Calendar',     subtitle: 'Plan your weekly split' },
  'History':     { title: 'History',      subtitle: 'All past sessions' },
  'AI Coach':    { title: 'AI Coach',     subtitle: 'Adaptive plan generator' },
  'Settings':    { title: 'Settings',     subtitle: 'Profile & preferences' },
};

export default function App() {
  const [user, setUser]           = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab]             = useState('Dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [theme, setTheme]         = useState(() => localStorage.getItem('fiq_theme') || 'dark');

  useEffect(() => {
    const stored = localStorage.getItem('fiq_user');
    const token  = localStorage.getItem('fiq_token');
    if (stored && token) { try { setUser(JSON.parse(stored)); } catch {} }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fiq_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  if (!authReady) return null;
  if (!user) return <AuthPage onAuth={setUser} />;

  const onWorkoutLogged = () => { setRefreshKey(k => k + 1); setTab('Dashboard'); };
  const initials = (user.name || user.email || 'A').slice(0, 2).toUpperCase();
  const meta = PAGE_META[tab];

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💪</div>
          <span className="sidebar-logo-text">FitnessIQ</span>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        {NAV.map(item => (
          <div key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
            <div className="nav-item-icon">{item.icon}</div>
            {item.label}
          </div>
        ))}

        <div className="sidebar-bottom">
          {/* Theme toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            <div onClick={toggleTheme} style={{ width: 36, height: 20, background: theme === 'dark' ? 'var(--navy-500)' : 'var(--cyan)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', transition: 'background 0.2s' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', marginLeft: theme === 'dark' ? 0 : 'auto', transition: 'margin 0.2s' }} />
            </div>
          </div>

          <div className={`user-chip ${tab === 'Settings' ? 'active' : ''}`}
            style={{ cursor: 'pointer', border: tab === 'Settings' ? '1px solid var(--cyan-border)' : '1px solid var(--border)' }}
            onClick={() => setTab('Settings')}>
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Athlete'}</div>
              <div className="user-status" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⚙</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-wrap">
        <div className="topbar">
          <div>
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-subtitle">{meta.subtitle}</div>
          </div>
          <div className="topbar-right">
            {tab === 'Dashboard'   && <span className="badge badge-green">● Live</span>}
            {tab === 'Log Workout' && <span className="badge badge-cyan">+ New Session</span>}
            {tab === 'Calendar'    && <span className="badge badge-cyan">◫ Weekly Split</span>}
            {tab === 'History'     && <span className="badge badge-cyan">◷ Log</span>}
            {tab === 'AI Coach'    && <span className="badge badge-cyan">◈ AI Coach</span>}
            {tab === 'Settings'    && <span className="badge badge-cyan">⚙ Account</span>}
          </div>
        </div>

        <div className="page-content">
          {tab === 'Dashboard'   && <Dashboard key={refreshKey} onNavigate={setTab} />}
          {tab === 'Log Workout' && <LogWorkout onLogged={onWorkoutLogged} />}
          {tab === 'Calendar'    && <Calendar />}
          {tab === 'History'     && <History />}
          {tab === 'AI Coach'    && <AICoach />}
          {tab === 'Settings'    && <Settings user={user} onUpdate={updated => {
            setUser(u => ({ ...u, ...updated }));
            localStorage.setItem('fiq_user', JSON.stringify({ ...user, ...updated }));
          }} />}
        </div>
      </div>

      {/* Rest timer — always available */}
      <RestTimer />

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {NAV.map(item => (
          <button key={item.id} className={`mobile-nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
