import { useState } from 'react';
import LogWorkout from './components/LogWorkout';
import Dashboard from './components/Dashboard';
import AICoach from './components/AICoach';
import './App.css';

const TABS = ['Dashboard', 'Log Workout', 'AI Coach'];

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
        <div className="logo">FitnessIQ</div>
        <nav className="tabs">
          {TABS.map(t => (
            <button
              key={t}
              className={`tab-btn ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
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
