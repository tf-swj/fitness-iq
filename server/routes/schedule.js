const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getSchedule, saveScheduleDay, clearScheduleDay } = require('../db/queries');

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(getSchedule(req.userId));
});

router.put('/:dayIndex', (req, res) => {
  const { label, color, notes } = req.body;
  if (!label) return res.status(400).json({ error: 'label required' });
  saveScheduleDay(req.userId, Number(req.params.dayIndex), label, color || '#00d4e8', notes);
  res.json({ ok: true });
});

router.delete('/:dayIndex', (req, res) => {
  clearScheduleDay(req.userId, Number(req.params.dayIndex));
  res.json({ ok: true });
});

module.exports = router;
