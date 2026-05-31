// Epley formula: weight * (1 + reps/30)
function estimated1RM(weight, reps) {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Group raw DB rows into { date -> { exerciseName -> sets[] } }
function groupByDateAndExercise(rows) {
  const byDate = {};
  for (const row of rows) {
    if (!byDate[row.date]) byDate[row.date] = {};
    if (!byDate[row.date][row.exercise_name]) byDate[row.date][row.exercise_name] = [];
    byDate[row.date][row.exercise_name].push(row);
  }
  return byDate;
}

// For each exercise, compute best estimated 1RM per week
function computeStrengthTrend(rows) {
  const byExercise = {};
  for (const row of rows) {
    const name = row.exercise_name;
    if (!byExercise[name]) byExercise[name] = {};
    const week = getWeekKey(row.date);
    const e1rm = estimated1RM(row.weight_lbs, row.reps);
    if (!byExercise[name][week] || e1rm > byExercise[name][week].e1rm) {
      byExercise[name][week] = { e1rm, date: row.date, weight: row.weight_lbs, reps: row.reps };
    }
  }

  const trends = {};
  for (const [exercise, weeks] of Object.entries(byExercise)) {
    const sorted = Object.entries(weeks).sort(([a], [b]) => a.localeCompare(b));
    trends[exercise] = sorted.map(([week, data]) => ({ week, ...data }));
  }
  return trends;
}

// Detect plateau: same or lower e1RM for 2+ consecutive weeks
function detectPlateaus(trends) {
  const plateaus = [];
  for (const [exercise, weekly] of Object.entries(trends)) {
    if (weekly.length < 3) continue;
    const recent = weekly.slice(-3);
    const stalled = recent.every((w, i) => i === 0 || w.e1rm <= recent[i - 1].e1rm * 1.01);
    if (stalled) {
      plateaus.push({
        exercise,
        weeks: recent.length,
        currentE1RM: recent[recent.length - 1].e1rm,
        startE1RM: recent[0].e1rm,
      });
    }
  }
  return plateaus;
}

// Weekly volume per muscle group: sum(sets * reps * weight)
function computeWeeklyVolume(rows) {
  const thisWeekStart = getMondayOfWeek(new Date().toISOString().slice(0, 10));
  const weekRows = rows.filter(r => r.date >= thisWeekStart);

  const volume = {};
  const sessionsByMuscle = {};
  for (const row of weekRows) {
    const mg = row.muscle_group;
    volume[mg] = (volume[mg] || 0) + row.reps * row.weight_lbs;
    if (!sessionsByMuscle[mg]) sessionsByMuscle[mg] = new Set();
    sessionsByMuscle[mg].add(row.date);
  }

  return { volume, sessionDays: Object.fromEntries(Object.entries(sessionsByMuscle).map(([k, v]) => [k, v.size])) };
}

// Flag overtraining: muscle group hit 4+ days this week
function detectOvertraining(sessionDays) {
  return Object.entries(sessionDays)
    .filter(([, days]) => days >= 4)
    .map(([muscle, days]) => ({ muscle, days }));
}

// Compute % strength gain from first to last week per exercise
function computeStrengthGains(trends) {
  const gains = {};
  for (const [exercise, weekly] of Object.entries(trends)) {
    if (weekly.length < 2) continue;
    const first = weekly[0].e1rm;
    const last = weekly[weekly.length - 1].e1rm;
    gains[exercise] = {
      percentGain: Math.round(((last - first) / first) * 1000) / 10,
      firstE1RM: first,
      currentE1RM: last,
      weeksTracked: weekly.length,
    };
  }
  return gains;
}

// Suggest deload: if training 4+ consecutive weeks without a deload
function shouldDeload(rows) {
  if (!rows.length) return false;
  const dates = [...new Set(rows.map(r => r.date))].sort();
  const weeks = [...new Set(dates.map(getWeekKey))];
  return weeks.length >= 4;
}

// Streak calculation
function computeStreaks(rows) {
  if (!rows.length) return { weekStreak: 0, dayStreak: 0, longestWeekStreak: 0, totalWorkoutDays: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const workoutDates = [...new Set(rows.map(r => r.date))].sort();
  const totalWorkoutDays = workoutDates.length;

  // ── Day streak: consecutive days ending today or yesterday ──
  let dayStreak = 0;
  const dateSet = new Set(workoutDates);
  let cursor = new Date(today + 'T00:00:00');

  // Allow 1 day grace (streak counts if last workout was yesterday)
  if (!dateSet.has(today)) cursor.setDate(cursor.getDate() - 1);

  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    dayStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // ── Week streak: consecutive weeks with at least 1 workout ──
  const workoutWeeks = new Set(workoutDates.map(getWeekKey));
  const currentWeek = getWeekKey(today);
  const allWeeks = [...workoutWeeks].sort();

  // Count back from current/last week
  let weekStreak = 0;
  let longestWeekStreak = 0;
  let tempStreak = 0;
  let checkDate = new Date(currentWeek + 'T00:00:00');

  // If no workout this week, start from last week
  if (!workoutWeeks.has(currentWeek)) checkDate.setDate(checkDate.getDate() - 7);

  while (workoutWeeks.has(checkDate.toISOString().slice(0, 10))) {
    weekStreak++;
    checkDate.setDate(checkDate.getDate() - 7);
  }

  // Longest ever week streak
  for (let i = 0; i < allWeeks.length; i++) {
    if (i === 0) { tempStreak = 1; continue; }
    const prev = new Date(allWeeks[i - 1] + 'T00:00:00');
    prev.setDate(prev.getDate() + 7);
    const expected = prev.toISOString().slice(0, 10);
    if (allWeeks[i] === expected) {
      tempStreak++;
    } else {
      tempStreak = 1;
    }
    longestWeekStreak = Math.max(longestWeekStreak, tempStreak);
  }
  longestWeekStreak = Math.max(longestWeekStreak, weekStreak);

  return { weekStreak, dayStreak, longestWeekStreak, totalWorkoutDays };
}

function runEngine(rows) {
  const trends = computeStrengthTrend(rows);
  const { volume, sessionDays } = computeWeeklyVolume(rows);
  const plateaus = detectPlateaus(trends);
  const overtraining = detectOvertraining(sessionDays);
  const gains = computeStrengthGains(trends);
  const deloadRecommended = shouldDeload(rows);
  const streaks = computeStreaks(rows);

  return { trends, volume, sessionDays, plateaus, overtraining, gains, deloadRecommended, streaks };
}

// --- helpers ---

function getWeekKey(dateStr) {
  const monday = getMondayOfWeek(dateStr);
  return monday;
}

function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

module.exports = { runEngine, estimated1RM, computeStrengthTrend, detectPlateaus };
