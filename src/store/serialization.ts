import type { Progress, QuestionProgress } from '../types';

export const STORAGE_KEY = 'lawgo:v1';

export function emptyProgress(): Progress {
  return {
    schemaVersion: 1,
    totalXp: 0,
    courseXp: {},
    dailyGoal: 20,
    dailyXp: {},
    goalDays: [],
    crowns: {},
    questions: {},
    bestScores: {},
    sessionsCompleted: 0,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isNumericRecord(value: unknown, max = Number.MAX_SAFE_INTEGER): boolean {
  return isRecord(value) && Object.values(value).every((entry) => isInteger(entry, max));
}

function isDailyXp(value: unknown): boolean {
  return (
    isRecord(value) && Object.entries(value).every(([date, xp]) => isDate(date) && isInteger(xp))
  );
}

function isQuestionProgress(value: unknown): value is QuestionProgress {
  return (
    isRecord(value) &&
    isInteger(value.box, 5) &&
    isDate(value.due) &&
    isInteger(value.attempts) &&
    isInteger(value.correct) &&
    isInteger(value.wrong) &&
    value.correct + value.wrong === value.attempts
  );
}

function isProgress(value: unknown): value is Progress {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  return (
    isInteger(value.totalXp) &&
    (value.courseXp === undefined || isNumericRecord(value.courseXp)) &&
    [10, 20, 30, 50].includes(value.dailyGoal as number) &&
    isInteger(value.sessionsCompleted) &&
    Array.isArray(value.goalDays) &&
    value.goalDays.every(isDate) &&
    isDailyXp(value.dailyXp) &&
    isNumericRecord(value.crowns, 3) &&
    isNumericRecord(value.bestScores) &&
    isRecord(value.questions) &&
    Object.values(value.questions).every(isQuestionProgress)
  );
}

export function parseProgress(json: string): Progress {
  const parsed: unknown = JSON.parse(json);
  if (!isProgress(parsed)) throw new Error('備份格式不正確，或版本不相容。');

  // Whitelist supported fields so imported metadata never becomes application state.
  return {
    schemaVersion: 1,
    totalXp: parsed.totalXp,
    // All progress predating multi-course support belongs to the first course.
    courseXp: parsed.courseXp ?? { patent: parsed.totalXp },
    dailyGoal: parsed.dailyGoal,
    dailyXp: parsed.dailyXp,
    goalDays: parsed.goalDays,
    crowns: parsed.crowns,
    questions: parsed.questions,
    bestScores: parsed.bestScores,
    sessionsCompleted: parsed.sessionsCompleted,
  };
}
