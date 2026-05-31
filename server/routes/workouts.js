const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { logWorkoutSession, logSets, getSessionsForUser, getExerciseHistory, getRecentSessions, getAllExerciseNames } = require('../db/queries');
const { runAgentPipeline, getDailyBrief, getPostWorkoutFeedback, streamChat } = require('../agent/pipeline');
const { runEngine } = require('../engine/overload');

router.use(requireAuth);

// Log workout + optional post-workout AI feedback
router.post('/', async (req, res) => {
  try {
    const { date, notes, sets, getAiFeedback } = req.body;
    if (!date || !sets?.length) return res.status(400).json({ error: 'date and sets required' });

    const sessionId = logWorkoutSession(req.userId, date, notes);
    logSets(sessionId, sets);

    let aiFeedback = null;
    if (getAiFeedback && process.env.ANTHROPIC_API_KEY?.trim()) {
      try {
        const allRows = getSessionsForUser(req.userId, 90);
        aiFeedback = await getPostWorkoutFeedback(sets, allRows);
      } catch (e) {
        console.error('Post-workout AI error:', e.message);
      }
    }

    res.json({ sessionId, aiFeedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions',  (req, res) => res.json(getRecentSessions(req.userId, 20)));
router.get('/exercises', (req, res) => res.json(getAllExerciseNames(req.userId)));
router.get('/history/:exercise', (req, res) => res.json(getExerciseHistory(req.userId, req.params.exercise)));

router.get('/engine', (req, res) => {
  try { res.json(runEngine(getSessionsForUser(req.userId, 90))); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// Daily brief — short AI summary for dashboard
router.get('/daily-brief', async (req, res) => {
  try {
    const rows = getSessionsForUser(req.userId, 90);
    if (!rows.length) return res.json({ text: null });
    if (!process.env.ANTHROPIC_API_KEY?.trim()) return res.json({ text: null });
    const brief = await getDailyBrief(rows);
    res.json(brief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full weekly analysis
router.post('/analyze', async (req, res) => {
  try {
    const rows = getSessionsForUser(req.userId, 90);
    if (!rows.length) return res.status(400).json({ error: 'No workout data logged yet' });
    res.json(await runAgentPipeline(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Streaming chat
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) return res.status(400).json({ error: 'messages required' });
    const rows = getSessionsForUser(req.userId, 90);
    await streamChat(messages, rows, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

module.exports = router;
