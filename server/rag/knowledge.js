// Exercise science knowledge base — chunked for retrieval
const CHUNKS = [
  {
    id: 'linear_progression',
    tags: ['plateau', 'beginner', 'progression'],
    text: 'Linear progression: add small amounts of weight each session (2.5–5 lbs on upper body, 5–10 lbs on lower body). This works for 3–6 months before stalling. When you stop progressing for 2+ weeks, it is a signal to switch strategies rather than keep trying the same weight.',
  },
  {
    id: 'undulating_periodization',
    tags: ['plateau', 'intermediate', 'periodization', 'volume'],
    text: 'Daily undulating periodization (DUP): rotate intensity and rep ranges across sessions (e.g. Monday 5x5 heavy, Wednesday 4x10 moderate, Friday 3x15 light). This prevents adaptation plateaus by varying the stimulus. Best for intermediate lifters who have exhausted linear progression.',
  },
  {
    id: 'volume_week',
    tags: ['plateau', 'volume', 'hypertrophy', 'deload'],
    text: 'When stuck on a weight, a volume week (drop to 70–80% 1RM, increase sets to 4–5, reps to 8–12) builds work capacity and muscle before returning heavier. Follow with an intensity week at 85–90% 1RM for 3–5 reps.',
  },
  {
    id: 'deload_protocol',
    tags: ['deload', 'fatigue', 'recovery', 'overtraining'],
    text: 'Deload week: reduce total volume by 40–50% (fewer sets or lighter weight). Perform every 4–6 weeks of hard training. Signs you need one: persistent soreness, declining performance, poor sleep, loss of motivation. After a deload, most athletes set PRs the following week due to supercompensation.',
  },
  {
    id: 'muscle_recovery_windows',
    tags: ['recovery', 'frequency', 'overtraining', 'muscle_group'],
    text: 'Muscle recovery windows: chest and shoulders need 48–72 hours; back 48–72 hours; legs (quads, hamstrings) need 72–96 hours; arms recover in 24–48 hours. Training a muscle group before it has recovered leads to overreaching and strength loss over time.',
  },
  {
    id: 'progressive_overload_principle',
    tags: ['progression', 'strength', 'volume'],
    text: 'Progressive overload: you must continually increase the stimulus on a muscle to drive adaptation. Methods in order of preference: (1) add weight, (2) add reps at the same weight, (3) add sets, (4) reduce rest periods. Use method 2 or 3 when method 1 stalls.',
  },
  {
    id: 'rpe_scale',
    tags: ['intensity', 'fatigue', 'autoregulation'],
    text: 'RPE (Rate of Perceived Exertion) scale: RPE 10 = max effort, no reps in reserve. RPE 8 = 2 reps in reserve. RPE 6 = 4 reps in reserve. Training consistently at RPE 9–10 without deloads causes cumulative fatigue. Optimal training zone for intermediate lifters is RPE 7–8.',
  },
  {
    id: 'frequency_optimization',
    tags: ['frequency', 'volume', 'muscle_group', 'strength'],
    text: 'Research supports training each muscle group 2–3 times per week for optimal hypertrophy and strength. More than 3x per week provides diminishing returns for most natural lifters. Spreading weekly volume across multiple sessions is more effective than one high-volume session.',
  },
  {
    id: 'strength_plateau_causes',
    tags: ['plateau', 'strength', 'troubleshooting'],
    text: 'Common causes of strength plateaus: (1) insufficient sleep — under 7 hours cuts strength gains by ~30%, (2) too little protein — aim for 0.7–1g per lb bodyweight, (3) accumulated fatigue from training too heavy too often, (4) technique breakdown under heavy loads, (5) psychological — going too close to failure too often.',
  },
  {
    id: 'novice_intermediate_transition',
    tags: ['progression', 'intermediate', 'periodization'],
    text: 'Transition from novice to intermediate: when you can no longer add weight each session, switch to weekly progression (add weight each week). Structure: Week 1 light (70% 1RM), Week 2 medium (75–80%), Week 3 heavy (85%+), Week 4 deload. This is the Texas Method or similar weekly wave loading.',
  },
];

// Simple TF-IDF-style keyword scoring for retrieval (no embeddings needed)
function scoreChunk(chunk, query) {
  const qWords = tokenize(query);
  const chunkText = tokenize(chunk.text + ' ' + chunk.tags.join(' '));
  let score = 0;
  for (const word of qWords) {
    if (chunkText.includes(word)) score += 1;
    if (chunk.tags.some(t => t.includes(word) || word.includes(t))) score += 2;
  }
  return score;
}

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s_]/g, '').split(/\s+/).filter(Boolean);
}

function retrieve(query, topK = 2) {
  const scored = CHUNKS.map(chunk => ({ chunk, score: scoreChunk(chunk, query) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(s => s.score > 0).map(s => s.chunk.text);
}

// Build a retrieval query from engine output
function buildQuery(engineOutput) {
  const parts = [];
  if (engineOutput.plateaus?.length) parts.push('plateau progression stalled');
  if (engineOutput.deloadRecommended) parts.push('deload fatigue recovery');
  if (engineOutput.overtraining?.length) parts.push('overtraining frequency recovery muscle group');
  if (!parts.length) parts.push('progressive overload volume strength');
  return parts.join(' ');
}

module.exports = { retrieve, buildQuery, CHUNKS };
