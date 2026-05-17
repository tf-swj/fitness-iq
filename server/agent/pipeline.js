const Anthropic = require('@anthropic-ai/sdk');
const { runEngine } = require('../engine/overload');
const { retrieve, buildQuery } = require('../rag/knowledge');

const client = new Anthropic();

async function runAgentPipeline(rows) {
  // Step 1: Overload engine
  const engineOutput = runEngine(rows);

  // Step 2: RAG retrieval
  const query = buildQuery(engineOutput);
  const retrievedPrinciples = retrieve(query, 3);

  // Step 3: Build structured context for Claude
  const context = buildContext(engineOutput);

  // Step 4: Call Claude
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a certified strength coach analyzing a lifter's training data.
You will receive structured performance data computed by a rule-based engine, plus retrieved exercise science principles.
Your job is to generate a specific, grounded weekly plan adjustment and progress summary.
Rules:
- Always cite specific numbers (weights, sets, reps, percentages)
- Every recommendation must reference the engine data or retrieved principles — no generic advice
- Keep explanations concise (1–2 sentences per exercise)
- Be direct and motivating`,
    messages: [
      {
        role: 'user',
        content: `Here is the athlete's computed performance data:

${context}

Relevant exercise science principles retrieved from knowledge base:
${retrievedPrinciples.map((p, i) => `[${i + 1}] ${p}`).join('\n\n')}

Generate:
1. A 2–3 sentence progress summary (what's going well, what needs attention)
2. Next week's adjusted training plan — list each exercise with specific sets/reps/weight adjustments and one-line reasoning
3. One motivational insight grounded in their actual numbers`,
      },
    ],
  });

  return {
    engineOutput,
    retrievedPrinciples,
    agentFeedback: response.content[0].text,
  };
}

function buildContext(e) {
  const lines = [];

  // Strength gains
  const gainEntries = Object.entries(e.gains);
  if (gainEntries.length) {
    lines.push('STRENGTH GAINS (first week vs current):');
    for (const [ex, g] of gainEntries) {
      lines.push(`  ${ex}: ${g.firstE1RM} → ${g.currentE1RM} lbs e1RM (+${g.percentGain}% over ${g.weeksTracked} weeks)`);
    }
  }

  // Plateaus
  if (e.plateaus.length) {
    lines.push('\nPLATEAUS DETECTED:');
    for (const p of e.plateaus) {
      lines.push(`  ${p.exercise}: stalled at ${p.currentE1RM} lbs e1RM for ${p.weeks} consecutive weeks`);
    }
  } else {
    lines.push('\nNo plateaus detected this period.');
  }

  // Weekly volume
  const volEntries = Object.entries(e.volume);
  if (volEntries.length) {
    lines.push('\nWEEKLY VOLUME (sets × reps × weight, this week):');
    for (const [mg, vol] of volEntries) {
      const days = e.sessionDays[mg] || 0;
      lines.push(`  ${mg}: ${Math.round(vol).toLocaleString()} lbs total volume, ${days} session day(s)`);
    }
  }

  // Overtraining
  if (e.overtraining.length) {
    lines.push('\nOVERTRAINING FLAGS:');
    for (const o of e.overtraining) {
      lines.push(`  ${o.muscle}: trained ${o.days} days this week (≥4 triggers flag)`);
    }
  }

  // Deload
  if (e.deloadRecommended) {
    lines.push('\nDELOAD SIGNAL: 4+ weeks of continuous training logged — supercompensation deload recommended.');
  }

  return lines.join('\n');
}

module.exports = { runAgentPipeline };
