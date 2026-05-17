const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fitness.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercise_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES workout_sessions(id),
      exercise_name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_lbs REAL NOT NULL,
      rpe INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO users (id, name) VALUES (1, 'Athlete');
  `);
}

module.exports = { getDb };
