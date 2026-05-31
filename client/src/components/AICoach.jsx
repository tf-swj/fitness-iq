import { useState, useRef, useEffect } from 'react';
import { runAnalysis, sendChatMessage } from '../api';

const SUGGESTED = [
  "What should I focus on this week?",
  "Why am I not getting stronger?",
  "Am I overtraining?",
  "Should I take a deload week?",
  "How do I break through my plateau?",
  "What's my weakest muscle group?",
];

export default function AICoach() {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [streaming, setStreaming]   = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [tab, setTab]               = useState('chat'); // 'chat' | 'plan'
  const bottomRef                   = useRef(null);
  const inputRef                    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = async (text) => {
    const content = text || input.trim();
    if (!content || streaming) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content }];
    setMessages(newMessages);
    setStreaming(true);

    // Add empty assistant message
    setMessages(m => [...m, { role: 'assistant', content: '' }]);

    try {
      const res = await sendChatMessage(newMessages.map(m => ({ role: m.role, content: m.content })));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const { text } = JSON.parse(data);
            setMessages(m => {
              const updated = [...m];
              updated[updated.length - 1] = { role: 'assistant', content: updated[updated.length - 1].content + text };
              return updated;
            });
          } catch {}
        }
      }
    } catch (err) {
      setMessages(m => {
        const updated = [...m];
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Make sure your API key is set in server/.env.' };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };

  const runFullAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const r = await runAnalysis();
      setAnalysisResult(r.data);
      setTab('plan');
    } catch (err) {
      alert(err.response?.data?.error || 'Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 120px)', minHeight: 500 }}>

      {/* ── Chat panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[['chat','💬 Chat with Alex'],['plan','📋 Full Plan Analysis']].map(([id, label]) => (
            <button key={id} type="button"
              className={tab === id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
              onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {tab === 'chat' ? (
          <>
            {/* Messages */}
            <div className="card" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', marginBottom: '0' }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                  <div style={{ width: 56, height: 56, background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>◈</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>Ask Alex anything</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 320, lineHeight: 1.6 }}>
                    Your AI coach has full context of your training history, strength trends, and plateaus.
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: m.role === 'user' ? 'linear-gradient(135deg, var(--cyan), #0099aa)' : 'var(--cyan-dim)',
                    border: '1px solid var(--cyan-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: m.role === 'user' ? '0.75rem' : '0.9rem',
                    fontWeight: 700, color: m.role === 'user' ? 'var(--navy-900)' : 'var(--cyan)',
                  }}>
                    {m.role === 'user' ? 'ME' : '◈'}
                  </div>
                  <div style={{
                    maxWidth: '75%',
                    background: m.role === 'user' ? 'var(--cyan-dim)' : 'var(--navy-700)',
                    border: `1px solid ${m.role === 'user' ? 'var(--cyan-border)' : 'var(--border)'}`,
                    borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                    {streaming && i === messages.length - 1 && m.role === 'assistant' && m.content === '' && (
                      <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                        {[0,1,2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block', animation: `bounce 1s ${j*0.15}s infinite` }} />)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                {SUGGESTED.map(s => (
                  <button key={s} type="button" className="btn-ghost" style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }} onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask your coach anything about your training..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                disabled={streaming}
                style={{ flex: 1 }}
              />
              <button className="btn-primary" onClick={() => send()} disabled={!input.trim() || streaming} style={{ padding: '0.6rem 1.25rem' }}>
                {streaming ? '...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          /* ── Full Plan tab ── */
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!analysisResult ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                <h3 style={{ marginBottom: '0.5rem' }}>Full Plan Analysis</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                  Runs the overload engine → retrieves exercise science principles → generates a complete next-week training plan with specific weights.
                </p>
                <button className="btn-primary" onClick={runFullAnalysis} disabled={analysisLoading} style={{ margin: '0 auto' }}>
                  {analysisLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 13, height: 13, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--navy-900)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Analyzing...
                    </span>
                  ) : '✦ Generate Full Analysis'}
                </button>
              </div>
            ) : (
              <>
                {/* Engine output */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-header">
                    <div><h2>Engine Analysis</h2><div className="card-subtitle">Rule-based performance data</div></div>
                    <span className="badge badge-cyan">Engine</span>
                  </div>
                  {analysisResult.engineOutput.plateaus?.map((p, i) => (
                    <div key={i} className="alert alert-warn" style={{ marginBottom: '0.5rem' }}>
                      <span>⚠️</span>
                      <div><div className="alert-title">{p.exercise}</div><div className="alert-body">{p.currentE1RM} lbs e1RM stalled {p.weeks} weeks</div></div>
                    </div>
                  ))}
                  {analysisResult.engineOutput.deloadRecommended && (
                    <div className="alert alert-info"><span>🔄</span><div><div className="alert-title">Deload Recommended</div></div></div>
                  )}
                  <div className="table-wrap" style={{ marginTop: '0.75rem' }}>
                    <table>
                      <thead><tr><th>Exercise</th><th>e1RM</th><th>Gain</th></tr></thead>
                      <tbody>
                        {Object.entries(analysisResult.engineOutput.gains || {}).map(([ex, g]) => (
                          <tr key={ex}>
                            <td style={{ fontWeight: 500 }}>{ex}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{g.firstE1RM}→{g.currentE1RM}</td>
                            <td><span className={g.percentGain >= 0 ? 'gain-positive' : 'gain-negative'}>{g.percentGain >= 0 ? '+' : ''}{g.percentGain}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Retrieved principles */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-header"><h2>Retrieved Knowledge</h2><span className="badge badge-green">RAG</span></div>
                  {analysisResult.retrievedPrinciples.map((p, i) => (
                    <div key={i} className="retrieved-principle"><span className="principle-num">[{i+1}]</span>{p}</div>
                  ))}
                </div>

                {/* AI plan */}
                <div className="card">
                  <div className="card-header"><div><h2>Your Personalised Plan</h2><div className="card-subtitle">Grounded in engine data + knowledge base</div></div><span className="badge badge-cyan">Claude AI</span></div>
                  <div className="ai-box">{analysisResult.agentFeedback}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}
