// Run: node seed.js — loads 6 weeks of demo data so the dashboard is populated immediately
require('dotenv').config();
const { logWorkoutSession, logSets } = require('./db/queries');
const { getDb } = require('./db/schema');

getDb(); // init schema

const today = new Date('2026-05-17');
function daysAgo(n) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const SESSIONS = [
  // Week 6 (most recent)
  { date: daysAgo(2), sets: [
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 1, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 2, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 3, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Incline Bench Press', muscle_group: 'Chest', set_number: 1, reps: 8, weight_lbs: 135 },
    { exercise_name: 'Incline Bench Press', muscle_group: 'Chest', set_number: 2, reps: 8, weight_lbs: 135 },
  ]},
  { date: daysAgo(4), sets: [
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 1, reps: 5, weight_lbs: 265 },
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 2, reps: 5, weight_lbs: 265 },
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 3, reps: 5, weight_lbs: 265 },
    { exercise_name: 'Romanian Deadlift', muscle_group: 'Hamstrings', set_number: 1, reps: 8, weight_lbs: 185 },
    { exercise_name: 'Romanian Deadlift', muscle_group: 'Hamstrings', set_number: 2, reps: 8, weight_lbs: 185 },
  ]},
  // Week 5
  { date: daysAgo(9), sets: [
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 1, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 2, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 3, reps: 4, weight_lbs: 185 },
  ]},
  { date: daysAgo(11), sets: [
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 1, reps: 5, weight_lbs: 255 },
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 2, reps: 5, weight_lbs: 255 },
    { exercise_name: 'Deadlift', muscle_group: 'Back', set_number: 1, reps: 3, weight_lbs: 315 },
    { exercise_name: 'Deadlift', muscle_group: 'Back', set_number: 2, reps: 3, weight_lbs: 315 },
  ]},
  // Week 4
  { date: daysAgo(16), sets: [
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 1, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 2, reps: 5, weight_lbs: 185 },
    { exercise_name: 'Overhead Press', muscle_group: 'Shoulders', set_number: 1, reps: 8, weight_lbs: 105 },
    { exercise_name: 'Overhead Press', muscle_group: 'Shoulders', set_number: 2, reps: 8, weight_lbs: 105 },
  ]},
  { date: daysAgo(18), sets: [
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 1, reps: 5, weight_lbs: 245 },
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 2, reps: 5, weight_lbs: 245 },
    { exercise_name: 'Deadlift', muscle_group: 'Back', set_number: 1, reps: 3, weight_lbs: 305 },
  ]},
  // Week 3
  { date: daysAgo(23), sets: [
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 1, reps: 5, weight_lbs: 175 },
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 2, reps: 5, weight_lbs: 175 },
    { exercise_name: 'Barbell Row', muscle_group: 'Back', set_number: 1, reps: 8, weight_lbs: 145 },
    { exercise_name: 'Barbell Row', muscle_group: 'Back', set_number: 2, reps: 8, weight_lbs: 145 },
  ]},
  // Week 2
  { date: daysAgo(30), sets: [
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 1, reps: 5, weight_lbs: 165 },
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 1, reps: 5, weight_lbs: 225 },
    { exercise_name: 'Deadlift', muscle_group: 'Back', set_number: 1, reps: 5, weight_lbs: 275 },
  ]},
  // Week 1
  { date: daysAgo(37), sets: [
    { exercise_name: 'Bench Press', muscle_group: 'Chest', set_number: 1, reps: 5, weight_lbs: 155 },
    { exercise_name: 'Squat', muscle_group: 'Quads', set_number: 1, reps: 5, weight_lbs: 205 },
    { exercise_name: 'Deadlift', muscle_group: 'Back', set_number: 1, reps: 5, weight_lbs: 255 },
    { exercise_name: 'Overhead Press', muscle_group: 'Shoulders', set_number: 1, reps: 8, weight_lbs: 95 },
  ]},
];

for (const session of SESSIONS) {
  const id = logWorkoutSession(1, session.date, '');
  logSets(id, session.sets);
  console.log(`Logged session ${id} on ${session.date} (${session.sets.length} sets)`);
}

console.log('\nDone! Seed data loaded. Bench Press will show a plateau (weeks 5-6 stalled).');
