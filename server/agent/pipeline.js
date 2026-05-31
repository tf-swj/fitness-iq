const Anthropic = require('@anthropic-ai/sdk');
const { runEngine } = require('../engine/overload');
const { retrieve, buildQuery } = require('../rag/knowledge');

const client = new Anthropic();

const COACH_PERSONA = `You are Alex, an elite strength and conditioning coach inside the FitnessIQ app.
You have access to the athlete's actual computed performance data — strength trends, plateau detection, volume metrics, and recovery signals — all calculated by a rule-based engine.
You also have retrieved exercise science principles relevant to their current situation.

Rules:
- Always reference specific numbers from the data (weights, percentages, weeks)
- Be direct, specific, and motivating — like a real coach, not a chatbot
- Every recommendation must be grounded in the data provided
- Keep it conversational but professional
- Never give generic advice — if you don't have data, say so`;

// ── Full weekly analysis (existing) ──
async function runAgentPipeline(rows) {
  const engineOutput = runEngine(rows);
  const query = buildQuery(engineOutput);
  const retrievedPrinciples = retrieve(query, 3);
  const context = buildContext(engineOutput);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: COACH_PERSONA,
    messages: [{
      role: 'user',
      content: `Here is the athlete's computed performance data:\n\n${context}\n\nRelevant exercise science principles:\n${retrievedPrinciples.map((p, i) => `[${i + 1}] ${p}`).join('\n\n')}\n\nGenerate:\n1. A 2–3 sentence progress summary\n2. Next week's adjusted training plan with specific sets/reps/weight\n3. One motivational insight grounded in their actual numbers`,
    }],
  });

  return { engineOutput, retrievedPrinciples, agentFeedback: response.content[0].text };
}

// ── Daily brief (short, auto-loads on dashboard) ──
async function getDailyBrief(rows) {
  if (!rows.length) return null;
  const engineOutput = runEngine(rows);
  const context = buildContext(engineOutput);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: COACH_PERSONA,
    messages: [{
      role: 'user',
      content: `Based on this training data, give me a 2-sentence daily coaching brief. Be specific with numbers. No fluff.\n\n${context}`,
    }],
  });

  return { text: response.content[0].text, engineOutput };
}

// ── Post-workout feedback (called right after logging) ──
async function getPostWorkoutFeedback(sessionSets, allRows) {
  const engineOutput = runEngine(allRows);
  const sessionSummary = summariseSession(sessionSets);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 180,
    system: COACH_PERSONA,
    messages: [{
      role: 'user',
      content: `The athlete just finished this session:\n${sessionSummary}\n\nOverall training context:\n${buildContext(engineOutput)}\n\nGive 1-2 sentences of specific, encouraging post-workout feedback. Reference the actual numbers they hit.`,
    }],
  });

  return response.content[0].text;
}

// ── Streaming chat ──
async function streamChat(messages, rows, res) {
  const engineOutput = rows.length ? runEngine(rows) : null;
  const context = engineOutput ? buildContext(engineOutput) : 'No workout data logged yet.';

  const systemPrompt = `${COACH_PERSONA}\n\nCurrent athlete data (always use this as context):\n${context}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages,
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
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
    lines.push('\nOVERTRAINING FLAGS:');
    for (const o of e.overtraining)
      lines.push(`  ${o.muscle}: ${o.days} days this week`);
  }
  if (e.deloadRecommended) lines.push('\nDELOAD SIGNAL: 4+ weeks continuous training.');
  return lines.join('\n');
}

function summariseSession(sets) {
  const byExercise = {};
  for (const s of sets) {
    if (!byExercise[s.exercise_name]) byExercise[s.exercise_name] = [];
    byExercise[s.exercise_name].push(s);
  }
  return Object.entries(byExercise).map(([name, sets]) => {
    const best = sets.reduce((max, s) => s.weight_lbs > max ? s.weight_lbs : max, 0);
    return `${name}: ${sets.length} sets, best ${best} lbs`;
  }).join('; ');
}

module.exports = { runAgentPipeline, getDailyBrief, getPostWorkoutFeedback, streamChat };
