const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { logWorkoutSession, logSets, getSessionsForUser, getExerciseHistory, getRecentSessions, getAllExerciseNames } = require('../db/queries');
const { runAgentPipeline } = require('../agent/pipeline');
const { runEngine } = require('../engine/overload');

// All workout routes require auth
router.use(requireAuth);

router.post('/', (req, res) => {
  try {
    const { date, notes, sets } = req.body;
    if (!date || !sets?.length) return res.status(400).json({ error: 'date and sets required' });
    const sessionId = logWorkoutSession(req.userId, date, notes);
    logSets(sessionId, sets);
    res.json({ sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sessions', (req, res) => res.json(getRecentSessions(req.userId, 20)));
router.get('/exercises', (req, res) => res.json(getAllExerciseNames(req.userId)));
router.get('/history/:exercise', (req, res) => res.json(getExerciseHistory(req.userId, req.params.exercise)));

router.get('/engine', (req, res) => {
  try {
    res.json(runEngine(getSessionsForUser(req.userId, 90)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const rows = getSessionsForUser(req.userId, 90);
    if (!rows.length) return res.status(400).json({ error: 'No workout data logged yet' });
    res.json(await runAgentPipeline(rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
