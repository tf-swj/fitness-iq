import { useState } from 'react';
import LogWorkout from './components/LogWorkout';
import Dashboard from './components/Dashboard';
import AICoach from './components/AICoach';
import './App.css';

const TABS = [
  { id: 'Dashboard', label: '📊 Dashboard' },
  { id: 'Log Workout', label: '➕ Log Workout' },
  { id: 'AI Coach', label: '🤖 AI Coach' },
];

export default function App() {
  const [tab, setTab] = useState('Dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const onWorkoutLogged = () => {
    setRefreshKey(k => k + 1);
    setTab('Dashboard');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">💪</div>
          FitnessIQ
        </div>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tab-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {tab === 'Dashboard' && <Dashboard key={refreshKey} />}
        {tab === 'Log Workout' && <LogWorkout onLogged={onWorkoutLogged} />}
        {tab === 'AI Coach' && <AICoach />}
      </main>
    </div>
  );
}
