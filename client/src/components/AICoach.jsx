import { useState } from 'react';
import { runAnalysis } from '../api';

export default function AICoach() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const analyze = async () => {
    setError('');
    setLoading(true);
    try {
      const r = await runAnalysis();
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed — make sure workouts are logged and ANTHROPIC_API_KEY is set in server/.env');
    } finally {
      setLoading(false);
    }
  };

  const { engineOutput: e } = result || {};
  const gainEntries = Object.entries(e?.gains || {});

  return (
    <>
      {/* Hero card */}
      <div className="card accent-border" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
            ◈
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>Adaptive AI Coach</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Rule-based engine analyzes your training data → RAG retrieves matching exercise science principles → Claude generates a grounded, specific plan. Not generic advice.
            </p>
          </div>
          <button className="btn-primary" onClick={analyze} disabled={loading} style={{ flexShrink: 0, padding: '0.65rem 1.5rem' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--navy-900)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Analyzing...
              </span>
            ) : '✦ Generate Analysis'}
          </button>
        </div>
        {error && <div className="error-msg" style={{ marginTop: '1rem' }}>⚠ {error}</div>}
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

          {/* Left col: Engine + RAG */}
          <div>
            {/* Engine output */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-header">
                <div>
                  <h2>Performance Data</h2>
                  <div className="card-subtitle">Rule-based engine — no AI in this step</div>
                </div>
                <span className="badge badge-cyan">Engine</span>
              </div>

              {e?.plateaus?.length > 0 && (
                <>
                  <div className="form-section-title">Plateaus</div>
                  {e.plateaus.map((p, i) => (
                    <div key={i} className="alert alert-warn" style={{ marginBottom: '0.5rem' }}>
                      <span>⚠️</span>
                      <div>
                        <div className="alert-title">{p.exercise}</div>
                        <div className="alert-body">{p.currentE1RM} lbs e1RM — stalled {p.weeks} weeks</div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {e?.deloadRecommended && (
                <div className="alert alert-info" style={{ marginBottom: '0.75rem' }}>
                  <span>🔄</span>
                  <div>
                    <div className="alert-title">Deload Signal</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>4+ weeks continuous training</div>
                  </div>
                </div>
              )}

              {gainEntries.length > 0 && (
                <>
                  <div className="form-section-title" style={{ marginTop: '0.5rem' }}>Strength Progress</div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Exercise</th><th>e1RM</th><th>Gain</th></tr></thead>
                      <tbody>
                        {gainEntries.map(([ex, g]) => (
                          <tr key={ex}>
                            <td style={{ fontWeight: 500 }}>{ex}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{g.firstE1RM}→{g.currentE1RM}</td>
                            <td><span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>{g.percentGain >= 0 ? '+' : ''}{g.percentGain}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Retrieved principles */}
            <div className="card" style={{ margin: 0 }}>
              <div className="card-header">
                <div>
                  <h2>Retrieved Knowledge</h2>
                  <div className="card-subtitle">Matched via RAG from knowledge base</div>
                </div>
                <span className="badge badge-green">RAG</span>
              </div>
              {result.retrievedPrinciples.map((p, i) => (
                <div key={i} className="retrieved-principle">
                  <span className="principle-num">[{i + 1}]</span>{p}
                </div>
              ))}
            </div>
          </div>

          {/* Right col: AI output */}
          <div className="card" style={{ margin: 0, height: 'fit-content' }}>
            <div className="card-header">
              <div>
                <h2>Your Personalized Plan</h2>
                <div className="card-subtitle">Grounded in engine data + knowledge base</div>
              </div>
              <span className="badge badge-cyan">Claude AI</span>
            </div>
            <div className="ai-box">{result.agentFeedback}</div>
          </div>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
