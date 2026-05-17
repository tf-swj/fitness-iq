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
      setError(err.response?.data?.error || 'Analysis failed — make sure you have workouts logged');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>AI Coach</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Analyzes your logged workout history using a progressive overload engine, then retrieves relevant
          exercise science principles to generate a grounded, personalized plan adjustment.
        </p>
        <button className="btn-primary" onClick={analyze} disabled={loading}>
          {loading ? 'Analyzing your training...' : 'Generate Weekly Analysis'}
        </button>
        {error && <div className="error-msg" style={{ marginTop: '1rem' }}>{error}</div>}
      </div>

      {result && (
        <>
          {/* Engine findings */}
          <div className="card">
            <h2>Performance Data (computed by engine)</h2>

            {result.engineOutput.plateaus?.length > 0 && (
              <>
                <div className="section-title">Plateaus Detected</div>
                {result.engineOutput.plateaus.map((p, i) => (
                  <div key={i} className="plateau-alert">
                    <span className="badge badge-warn">PLATEAU</span>
                    <strong>{p.exercise}</strong> — {p.currentE1RM} lbs e1RM stalled for {p.weeks} weeks
                  </div>
                ))}
              </>
            )}

            {result.engineOutput.overtraining?.length > 0 && (
              <>
                <div className="section-title">Overtraining Flags</div>
                {result.engineOutput.overtraining.map((o, i) => (
                  <div key={i} className="plateau-alert">
                    <span className="badge badge-warn">HIGH FREQ</span>
                    <strong>{o.muscle}</strong> — trained {o.days} days this week
                  </div>
                ))}
              </>
            )}

            {result.engineOutput.deloadRecommended && (
              <div className="plateau-alert" style={{ borderColor: '#4090ff', color: '#4090ff', background: '#0a1a2a' }}>
                <span className="badge badge-info">DELOAD</span>
                4+ weeks of continuous training detected — supercompensation deload recommended
              </div>
            )}

            {Object.keys(result.engineOutput.gains || {}).length > 0 && (
              <>
                <div className="section-title">Strength Gains</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Exercise</th><th>e1RM Change</th><th>% Gain</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(result.engineOutput.gains).map(([ex, g]) => (
                        <tr key={ex}>
                          <td>{ex}</td>
                          <td>{g.firstE1RM} → {g.currentE1RM} lbs</td>
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
          <div className="card">
            <h2>Retrieved Exercise Science Principles</h2>
            <p style={{ color: '#666', fontSize: '0.8rem', marginBottom: '1rem' }}>
              These were retrieved from the knowledge base based on your training profile and used to ground the AI's recommendations below.
            </p>
            {result.retrievedPrinciples.map((p, i) => (
              <div key={i} style={{ background: '#1a2a1a', border: '1px solid #2a4a2a', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#90c890', lineHeight: 1.6 }}>
                [{i + 1}] {p}
              </div>
            ))}
          </div>

          {/* AI feedback */}
          <div className="card">
            <h2>AI Coach Recommendation</h2>
            <div className="ai-box">{result.agentFeedback}</div>
          </div>
        </>
      )}
    </>
  );
}
