import { useState } from 'react';
import { runAnalysis } from '../api';

export default function AICoach() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    setError('');
    setLoading(true);
    try {
      const r = await runAnalysis();
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed — make sure you have workouts logged and your API key is set in server/.env');
    } finally {
      setLoading(false);
    }
  };

  const { engineOutput: e } = result || {};
  const gainEntries = Object.entries(e?.gains || {});

  return (
    <>
      {/* Hero */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #f8f8ff, #f0f0ff)', border: '1px solid #e0e0f8' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #5b5ef4, #818cf8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: '0.3rem' }}>AI Coach</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Your training data is analyzed by a rule-based engine, then matched against exercise science principles to generate a grounded, personalized recommendation — not generic advice.
            </p>
          </div>
          <button className="btn-primary" onClick={analyze} disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Analyzing...
              </span>
            ) : '✦ Generate Analysis'}
          </button>
        </div>
        {error && <div className="error-msg" style={{ marginTop: '1rem' }}>⚠ {error}</div>}
      </div>

      {result && (
        <>
          {/* Engine findings */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Performance Data</h2>
                <div className="card-subtitle">Computed by rule-based engine — no AI involved in this step</div>
              </div>
              <span className="badge badge-accent">Engine Output</span>
            </div>

            {e.plateaus?.length > 0 && (
              <>
                <div className="form-section-title">Plateaus</div>
                {e.plateaus.map((p, i) => (
                  <div key={i} className="alert alert-warn" style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '1.1rem' }}>⚠️</div>
                    <div>
                      <div className="alert-title">{p.exercise}</div>
                      <div className="alert-body">Stalled at {p.currentE1RM} lbs e1RM for {p.weeks} consecutive weeks</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {e.overtraining?.length > 0 && (
              <>
                <div className="form-section-title" style={{ marginTop: '1rem' }}>Overtraining Flags</div>
                {e.overtraining.map((o, i) => (
                  <div key={i} className="alert alert-warn">
                    <div style={{ fontSize: '1.1rem' }}>🔴</div>
                    <div>
                      <div className="alert-title">{o.muscle}</div>
                      <div className="alert-body">Trained {o.days} days this week — recovery compromised</div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {e.deloadRecommended && (
              <div className="alert alert-info" style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '1.1rem' }}>🔄</div>
                <div>
                  <div className="alert-title">Deload Signal</div>
                  <div style={{ color: '#1d4ed8', fontSize: '0.85rem', marginTop: '0.1rem' }}>4+ continuous weeks of training detected</div>
                </div>
              </div>
            )}

            {gainEntries.length > 0 && (
              <>
                <div className="form-section-title" style={{ marginTop: '1rem' }}>Strength Progress</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Exercise</th><th>Starting e1RM</th><th>Current e1RM</th><th>Gain</th><th>Weeks</th></tr>
                    </thead>
                    <tbody>
                      {gainEntries.map(([ex, g]) => (
                        <tr key={ex}>
                          <td style={{ fontWeight: 500 }}>{ex}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{g.firstE1RM} lbs</td>
                          <td style={{ fontWeight: 600 }}>{g.currentE1RM} lbs</td>
                          <td><span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>{g.percentGain >= 0 ? '+' : ''}{g.percentGain}%</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{g.weeksTracked}w</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Retrieved principles */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Retrieved Knowledge</h2>
                <div className="card-subtitle">Exercise science principles matched to your training profile via RAG</div>
              </div>
              <span className="badge badge-good">Knowledge Base</span>
            </div>
            {result.retrievedPrinciples.map((p, i) => (
              <div key={i} className="retrieved-principle">
                <span className="principle-num">[{i + 1}]</span>{p}
              </div>
            ))}
          </div>

          {/* AI Recommendation */}
          <div className="card">
            <div className="card-header">
              <div>
                <h2>Your Personalized Plan</h2>
                <div className="card-subtitle">Grounded in your engine data and retrieved principles above</div>
              </div>
              <span className="badge badge-accent">Claude AI</span>
            </div>
            <div className="ai-box">{result.agentFeedback}</div>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
