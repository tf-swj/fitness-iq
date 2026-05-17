const express = require('express');
const router = express.Router();
const { logWorkoutSession, logSets, getSessionsForUser, getExerciseHistory, getRecentSessions, getAllExerciseNames } = require('../db/queries');
const { runAgentPipeline } = require('../agent/pipeline');
const { runEngine } = require('../engine/overload');

const USER_ID = 1;

// POST /api/workouts — log a workout session
router.post('/', (req, res) => {
  try {
    const { date, notes, sets } = req.body;
    if (!date || !sets?.length) return res.status(400).json({ error: 'date and sets required' });

    const sessionId = logWorkoutSession(USER_ID, date, notes);
    logSets(sessionId, sets);
    res.json({ sessionId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workouts/sessions — recent sessions list
router.get('/sessions', (req, res) => {
  res.json(getRecentSessions(USER_ID, 20));
});

// GET /api/workouts/exercises — all distinct exercises
router.get('/exercises', (req, res) => {
  res.json(getAllExerciseNames(USER_ID));
});

// GET /api/workouts/history/:exercise — history for a single exercise
router.get('/history/:exercise', (req, res) => {
  res.json(getExerciseHistory(USER_ID, req.params.exercise));
});

// GET /api/workouts/engine — run overload engine, return raw stats
router.get('/engine', (req, res) => {
  try {
    const rows = getSessionsForUser(USER_ID, 90);
    const result = runEngine(rows);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workouts/analyze — run full agent pipeline
router.post('/analyze', async (req, res) => {
  try {
    const rows = getSessionsForUser(USER_ID, 90);
    if (!rows.length) return res.status(400).json({ error: 'No workout data logged yet' });
    const result = await runAgentPipeline(rows);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
