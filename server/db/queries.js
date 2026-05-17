const { getDb } = require('./schema');

function logWorkoutSession(userId, date, notes = '') {
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO workout_sessions (user_id, date, notes) VALUES (?, ?, ?)'
  ).run(userId, date, notes);
  return result.lastInsertRowid;
}

function logSets(sessionId, sets) {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO exercise_sets (session_id, exercise_name, muscle_group, set_number, reps, weight_lbs, rpe)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertMany = db.transaction((sets) => {
    for (const s of sets) {
      stmt.run(sessionId, s.exercise_name, s.muscle_group, s.set_number, s.reps, s.weight_lbs, s.rpe ?? null);
    }
  });
  insertMany(sets);
}

function getSessionsForUser(userId, limitDays = 90) {
  const db = getDb();
  return db.prepare(`
    SELECT ws.id, ws.date, ws.notes,
           es.exercise_name, es.muscle_group, es.set_number, es.reps, es.weight_lbs, es.rpe
    FROM workout_sessions ws
    JOIN exercise_sets es ON es.session_id = ws.id
    WHERE ws.user_id = ?
      AND ws.date >= date('now', ? || ' days')
    ORDER BY ws.date DESC, es.exercise_name, es.set_number
  `).all(userId, `-${limitDays}`);
}

function getExerciseHistory(userId, exerciseName) {
  const db = getDb();
  return db.prepare(`
    SELECT ws.date, es.set_number, es.reps, es.weight_lbs, es.rpe
    FROM exercise_sets es
    JOIN workout_sessions ws ON ws.id = es.session_id
    WHERE ws.user_id = ? AND LOWER(es.exercise_name) = LOWER(?)
    ORDER BY ws.date ASC, es.set_number ASC
  `).all(userId, exerciseName);
}

function getRecentSessions(userId, limit = 10) {
  const db = getDb();
  return db.prepare(`
    SELECT id, date, notes FROM workout_sessions
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ?
  `).all(userId, limit);
}

function getAllExerciseNames(userId) {
  const db = getDb();
  return db.prepare(`
    SELECT DISTINCT es.exercise_name, es.muscle_group
    FROM exercise_sets es
    JOIN workout_sessions ws ON ws.id = es.session_id
    WHERE ws.user_id = ?
    ORDER BY es.exercise_name
  `).all(userId);
}

module.exports = { logWorkoutSession, logSets, getSessionsForUser, getExerciseHistory, getRecentSessions, getAllExerciseNames };
