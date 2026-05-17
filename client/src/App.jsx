import { useState } from 'react';
import LogWorkout from './components/LogWorkout';
import Dashboard from './components/Dashboard';
import AICoach from './components/AICoach';
import './App.css';

const NAV = [
  { id: 'Dashboard',   icon: '▦',  label: 'Dashboard' },
  { id: 'Log Workout', icon: '+',  label: 'Log Workout' },
  { id: 'AI Coach',    icon: '◈',  label: 'AI Coach' },
];

const PAGE_META = {
  'Dashboard':   { title: 'Dashboard',    subtitle: 'Your training overview' },
  'Log Workout': { title: 'Log Workout',  subtitle: 'Record your session' },
  'AI Coach':    { title: 'AI Coach',     subtitle: 'Adaptive plan generator' },
};

export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const onWorkoutLogged = () => {
    setRefreshKey(k => k + 1);
    setTab('Dashboard');
  };

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
          <div
            key={item.id}
            className={`nav-item ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <div className="nav-item-icon">{item.icon}</div>
            {item.label}
          </div>
        ))}

        <div className="sidebar-bottom">
          <div className="user-chip">
            <div className="user-avatar">A</div>
            <div>
              <div className="user-name">Athlete</div>
              <div className="user-status">Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="main-wrap">
        <div className="topbar">
          <div>
            <div className="topbar-title">{meta.title}</div>
            <div className="topbar-subtitle">{meta.subtitle}</div>
          </div>
          <div className="topbar-right">
            {tab === 'Log Workout' && (
              <span className="badge badge-cyan">+ New Session</span>
            )}
            {tab === 'Dashboard' && (
              <span className="badge badge-green">● Live</span>
            )}
          </div>
        </div>

        <div className="page-content">
          {tab === 'Dashboard'   && <Dashboard key={refreshKey} onNavigate={setTab} />}
          {tab === 'Log Workout' && <LogWorkout onLogged={onWorkoutLogged} />}
          {tab === 'AI Coach'    && <AICoach />}
        </div>
      </div>
    </div>
  );
}
