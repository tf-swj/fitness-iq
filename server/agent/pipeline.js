const { runEngine } = require('../engine/overload');
const { retrieve, buildQuery } = require('../rag/knowledge');

const OR_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL  = 'anthropic/claude-sonnet-4-5';

function getHeaders() {
  const key = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!key) throw new Error('ANTHROPIC_API_KEY not set in server/.env');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'HTTP-Referer': 'http://localhost:5173',
    'X-Title': 'FitnessIQ',
  };
}

async function chat(messages, maxTokens = 600) {
  const res = await fetch(OR_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

const COACH_PERSONA = `You are Alex, an elite strength and conditioning coach inside the FitnessIQ app.
You have access to the athlete's actual computed performance data — strength trends, plateau detection, volume metrics, and recovery signals — calculated by a rule-based engine.

Rules:
- Always reference specific numbers from the data (weights, percentages, weeks)
- Be direct, specific, and motivating — like a real coach, not a chatbot
- Every recommendation must be grounded in the data provided
- Keep it conversational but professional
- Never give generic advice`;

// ── Full weekly analysis ──
async function runAgentPipeline(rows) {
  const engineOutput = runEngine(rows);
  const retrievedPrinciples = retrieve(buildQuery(engineOutput), 3);
  const context = buildContext(engineOutput);

  const text = await chat([
    { role: 'system', content: COACH_PERSONA },
    { role: 'user', content: `Athlete performance data:\n\n${context}\n\nRelevant exercise science:\n${retrievedPrinciples.map((p,i) => `[${i+1}] ${p}`).join('\n\n')}\n\nGenerate:\n1. 2-3 sentence progress summary\n2. Next week's adjusted plan with specific sets/reps/weight\n3. One motivational insight grounded in their numbers` },
  ], 1024);

  return { engineOutput, retrievedPrinciples, agentFeedback: text };
}

// ── Daily brief ──
async function getDailyBrief(rows) {
  if (!rows.length) return null;
  const engineOutput = runEngine(rows);
  const context = buildContext(engineOutput);

  const text = await chat([
    { role: 'system', content: COACH_PERSONA },
    { role: 'user', content: `Based on this training data, give a 2-sentence daily coaching brief. Be specific with numbers. No fluff.\n\n${context}` },
  ], 200);

  return { text, engineOutput };
}

// ── Post-workout feedback ──
async function getPostWorkoutFeedback(sessionSets, allRows) {
  const engineOutput = runEngine(allRows);
  const text = await chat([
    { role: 'system', content: COACH_PERSONA },
    { role: 'user', content: `Athlete just finished:\n${summariseSession(sessionSets)}\n\nContext:\n${buildContext(engineOutput)}\n\nGive 1-2 sentences of specific post-workout feedback referencing their actual numbers.` },
  ], 180);
  return text;
}

// ── Streaming chat ──
async function streamChat(messages, rows, res) {
  const context = rows.length ? buildContext(runEngine(rows)) : 'No workout data yet.';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const systemMsg = { role: 'system', content: `${COACH_PERSONA}\n\nCurrent athlete data:\n${context}` };

  const response = await fetch(OR_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 600,
      stream: true,
      messages: [systemMsg, ...messages],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    res.write(`data: ${JSON.stringify({ text: `Error: ${err}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  const reader = response.body.getReader();
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
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
      } catch {}
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ── Helpers ──
function buildContext(e) {
  const lines = [];
  const gainEntries = Object.entries(e.gains || {});
  if (gainEntries.length) {
    lines.push('STRENGTH GAINS:');
    for (const [ex, g] of gainEntries)
      lines.push(`  ${ex}: ${g.firstE1RM} → ${g.currentE1RM} lbs e1RM (+${g.percentGain}% over ${g.weeksTracked} weeks)`);
  }
  if (e.plateaus?.length) {
    lines.push('\nPLATEAUS:');
    for (const p of e.plateaus)
      lines.push(`  ${p.exercise}: stalled at ${p.currentE1RM} lbs e1RM for ${p.weeks} weeks`);
  } else {
    lines.push('\nNo plateaus detected.');
  }
  const volEntries = Object.entries(e.volume || {});
  if (volEntries.length) {
    lines.push('\nWEEKLY VOLUME:');
    for (const [mg, vol] of volEntries)
      lines.push(`  ${mg}: ${Math.round(vol).toLocaleString()} lbs (${e.sessionDays?.[mg] || 0} days)`);
  }
  if (e.overtraining?.length) {
    lines.push('\nOVERTRAINING:');
    for (const o of e.overtraining)
      lines.push(`  ${o.muscle}: ${o.days} days this week`);
  }
  if (e.deloadRecommended) lines.push('\nDELOAD SIGNAL: 4+ weeks continuous training.');
  return lines.join('\n');
}

function summariseSession(sets) {
  const byEx = {};
  for (const s of sets) {
    if (!byEx[s.exercise_name]) byEx[s.exercise_name] = [];
    byEx[s.exercise_name].push(s);
  }
  return Object.entries(byEx).map(([name, sets]) => {
    const best = sets.reduce((max, s) => s.weight_lbs > max ? s.weight_lbs : max, 0);
    return `${name}: ${sets.length} sets, best ${best} lbs`;
  }).join('; ');
}

module.exports = { runAgentPipeline, getDailyBrief, getPostWorkoutFeedback, streamChat };
