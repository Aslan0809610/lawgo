import { describe, expect, it } from 'vitest';
import rawQuestions from '../../content/fixtures/sample-questions.json';
import rawCourse from '../../content/courses/patent/course.json';
import { emptyProgress } from '../store';
import type { Course, Question, QuestionProgress } from '../types';
import {
  INTERVALS,
  addDays,
  addXp,
  answerSession,
  articleMastery,
  buildSession,
  checkAnswer,
  deadlineQuestions,
  deadlineRemaining,
  dueReviews,
  isLessonUnlocked,
  isUnitUnlocked,
  key,
  localDate,
  nextCrown,
  recordBest,
  scheduleReview,
  seededRng,
  sessionXp,
  setGoal,
  shuffle,
  startSession,
  streak,
  systemClock,
} from './index';
const questions = rawQuestions as Question[];
const course = rawCourse as Course;
const now = new Date(2026, 10, 17, 23, 58);
const qp = (box = 1): QuestionProgress => ({
  box,
  due: '2026-11-17',
  attempts: 1,
  correct: 0,
  wrong: 1,
});
const makePool = (count = 30): Question[] =>
  Array.from({ length: count }, (_, i) => ({
    ...questions[0],
    id: `test-${i}`,
    difficulty: ((i % 3) + 1) as 1 | 2 | 3,
  }));
describe('deterministic selection', () => {
  it('seeds identical random streams and does not mutate shuffled arrays', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    expect(Array.from({ length: 10 }, a)).toEqual(Array.from({ length: 10 }, b));
    const input = [1, 2, 3, 4];
    const result = shuffle(input, seededRng(1));
    expect(result).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4]);
    expect([...result].sort()).toEqual(input);
    expect(shuffle([], seededRng(0))).toEqual([]);
  });
  it.each([0, 1, 2, 3])('respects crown %i difficulty bands and caps at ten', (crown) => {
    const pool = makePool();
    const p = emptyProgress();
    const result = buildSession(pool, p, 'patent', crown, 17);
    expect(result).toHaveLength(10);
    expect(new Set(result.map((q) => q.id)).size).toBe(10);
    expect(
      result.every((q) => (crown === 0 ? q.difficulty <= 2 : crown === 1 || q.difficulty >= 2)),
    ).toBe(true);
    expect(result).toEqual(buildSession(pool, p, 'patent', crown, 17));
  });
  it('prioritizes unseen, then previously wrong, then correct', () => {
    const pool = makePool(3);
    const p = emptyProgress();
    p.questions[key('patent', pool[0].id)] = { ...qp(), correct: 1, wrong: 0 };
    p.questions[key('patent', pool[1].id)] = qp();
    expect(buildSession(pool, p, 'patent', 1, 0).map((q) => q.id)).toEqual([
      pool[2].id,
      pool[1].id,
      pool[0].id,
    ]);
  });
  it('uses the whole smaller pool; unit sessions mix fifteen across all difficulties', () => {
    expect(buildSession(questions.slice(0, 1), emptyProgress(), 'patent', 0, 1)).toHaveLength(1);
    expect(buildSession(makePool(), emptyProgress(), 'patent', 0, 1, 15, true)).toHaveLength(15);
    expect(buildSession([], emptyProgress(), 'patent', 0, 1)).toEqual([]);
  });
});
describe('answer checking', () => {
  it('checks true / false without coercion', () => {
    expect(checkAnswer(questions[0], false)).toBe(true);
    expect(checkAnswer(questions[0], true)).toBe(false);
    expect(checkAnswer(questions[0], 0)).toBe(false);
  });
  it('checks the original option index', () => {
    expect(checkAnswer(questions[1], 1)).toBe(true);
    expect(checkAnswer(questions[1], 0)).toBe(false);
  });
  it('checks every blank and length', () => {
    expect(checkAnswer(questions[2], ['申請日', '二十'])).toBe(true);
    expect(checkAnswer(questions[2], ['二十', '申請日'])).toBe(false);
    expect(checkAnswer(questions[2], ['申請日'])).toBe(false);
  });
  it('checks unordered pairs and rejects duplicated or incomplete pairs', () => {
    const q = questions[3];
    if (q.type !== 'match') throw new Error();
    expect(checkAnswer(q, [...q.pairs].reverse())).toBe(true);
    expect(checkAnswer(q, Array(4).fill(q.pairs[0]))).toBe(false);
    expect(checkAnswer(q, q.pairs.slice(1))).toBe(false);
    expect(checkAnswer(q, ['發明專利'])).toBe(false);
  });
  it('checks exact order', () => {
    const q = questions[4];
    if (q.type !== 'order') throw new Error();
    expect(checkAnswer(q, q.items)).toBe(true);
    expect(checkAnswer(q, [...q.items].reverse())).toBe(false);
    expect(checkAnswer(q, [...q.items, '多餘'])).toBe(false);
  });
});
describe('hearts, retry queue and reward', () => {
  it('starts with five hearts, wrong goes to the back until corrected', () => {
    const initial = startSession(questions.slice(0, 2), now);
    const wrong = answerSession(initial, false);
    expect(initial.hearts).toBe(5);
    expect(initial.queue).toEqual(questions.slice(0, 2));
    expect(wrong.hearts).toBe(4);
    expect(wrong.queue.map((q) => q.id)).toEqual([questions[1].id, questions[0].id]);
    const second = answerSession(wrong, true);
    const complete = answerSession(second, true);
    expect(complete.status).toBe('complete');
    expect(complete.attempts).toBe(3);
    expect(complete.correct).toBe(2);
    expect(complete.firstAnswers[questions[0].id]).toBe(false);
    expect(sessionXp(complete)).toBe(10);
  });
  it('fails at zero hearts without reward; terminal sessions are immutable', () => {
    let session = startSession(questions.slice(0, 1), now);
    for (let i = 0; i < 5; i++) session = answerSession(session, false);
    expect(session.status).toBe('failed');
    expect(session.hearts).toBe(0);
    expect(sessionXp(session)).toBe(0);
    expect(answerSession(session, true)).toBe(session);
  });
  it('awards fifteen XP only for a perfect completed session, never an empty one', () => {
    const perfect = answerSession(startSession(questions.slice(0, 1), now), true);
    expect(sessionXp(perfect)).toBe(15);
    expect(sessionXp(startSession([], now))).toBe(0);
    expect(sessionXp(startSession(questions, now))).toBe(0);
  });
});
describe('crowns and course unlocks', () => {
  it('caps crowns at three', () => {
    expect([0, 1, 2, 3].map(nextCrown)).toEqual([1, 2, 3, 3]);
  });
  it('unlocks only first lesson or the lesson after a completed one, across units', () => {
    const crowns = { [key(course.id, 'u01-l1')]: 1, [key(course.id, 'u01-l4')]: 1 };
    expect(isLessonUnlocked(course, 'u01-l1', {})).toBe(true);
    expect(isLessonUnlocked(course, 'u01-l2', crowns)).toBe(true);
    expect(isLessonUnlocked(course, 'u01-l3', crowns)).toBe(false);
    expect(isLessonUnlocked(course, 'u02-l1', crowns)).toBe(true);
    expect(isLessonUnlocked(course, 'missing', crowns)).toBe(false);
    expect(isLessonUnlocked({ ...course, id: 'other' }, 'u01-l2', crowns)).toBe(false);
  });
  it('requires every lesson of the unit for its challenge', () => {
    const crowns = Object.fromEntries(
      course.units[0].lessons.map((l) => [key(course.id, l.id), 1]),
    );
    expect(isUnitUnlocked(course, 'u01', crowns)).toBe(true);
    delete crowns[key(course.id, 'u01-l2')];
    expect(isUnitUnlocked(course, 'u01', crowns)).toBe(false);
    expect(isUnitUnlocked(course, 'missing', crowns)).toBe(false);
  });
});
describe('local dates, goal and streak', () => {
  it('uses local year/month/day and calendar arithmetic', () => {
    expect(localDate(now)).toBe('2026-11-17');
    expect(addDays(now, 1)).toBe('2026-11-18');
    expect(addDays(new Date(2026, 11, 31, 23), 1)).toBe('2027-01-01');
    expect(addDays(new Date(2024, 1, 28), 1)).toBe('2024-02-29');
    expect(systemClock.now()).toBeInstanceOf(Date);
  });
  it('accumulates daily XP and marks a goal only once', () => {
    const first = addXp(emptyProgress(), 15, now);
    const second = addXp(first, 10, now);
    const third = addXp(second, 15, now);
    expect(first.goalDays).toEqual([]);
    expect(third.dailyXp['2026-11-17']).toBe(40);
    expect(third.totalXp).toBe(40);
    expect(third.goalDays).toEqual(['2026-11-17']);
    expect(first.totalXp).toBe(15);
  });
  it('keeps yesterday streak while today is in progress, expires after a missed day', () => {
    const p = { ...emptyProgress(), goalDays: ['2026-11-15', '2026-11-16'] };
    expect(streak(p, now)).toBe(2);
    expect(streak(p, new Date(2026, 10, 18))).toBe(0);
    expect(streak({ ...p, goalDays: [...p.goalDays, '2026-11-17'] }, now)).toBe(3);
    expect(streak(emptyProgress(), now)).toBe(0);
  });
  it('lowering the goal immediately recognizes today’s XP; changing a goal keeps achieved days', () => {
    const p = addXp(emptyProgress(), 15, now);
    const lowered = setGoal(p, 10, now);
    expect(lowered.goalDays).toContain(localDate(now));
    expect(setGoal(lowered, 50, now).goalDays).toContain(localDate(now));
  });
});
describe('Leitner review and article mastery', () => {
  it('advances first-try correct, caps at five and schedules every interval', () => {
    expect(scheduleReview(undefined, true, now)).toEqual({
      box: 1,
      due: '2026-11-18',
      attempts: 1,
      correct: 1,
      wrong: 0,
    });
    for (let box = 0; box <= 5; box++) {
      const next = scheduleReview(qp(box), true, now);
      expect(next.box).toBe(Math.min(5, box + 1));
      expect(next.due).toBe(addDays(now, INTERVALS[next.box]));
    }
  });
  it('resets wrong to box one, due tomorrow', () => {
    expect(scheduleReview(qp(5), false, now)).toEqual({
      box: 1,
      due: '2026-11-18',
      attempts: 2,
      correct: 0,
      wrong: 2,
    });
  });
  it('selects only due seen questions from unlocked lessons, max ten oldest first', () => {
    const pool = makePool(15).map((q) => ({ ...q, lessonId: 'u01-l1' }));
    const p = emptyProgress();
    pool.forEach(
      (q, i) =>
        (p.questions[key(course.id, q.id)] = {
          ...qp(),
          due: i === 0 ? '2026-11-18' : `2026-11-${String(i).padStart(2, '0')}`,
        }),
    );
    pool[14] = { ...pool[14], lessonId: 'u02-l1' };
    const result = dueReviews(pool, course, p, now);
    expect(result).toHaveLength(10);
    expect(result[0].id).toBe(pool[1].id);
    expect(result.some((q) => q.id === pool[0].id || q.id === pool[14].id)).toBe(false);
    expect(dueReviews(questions, course, emptyProgress(), now)).toEqual([]);
  });
  it('computes mastery from evidence, including unattempted related questions', () => {
    const p = emptyProgress();
    const q = questions[3];
    p.questions[key(course.id, q.id)] = qp(5);
    expect(articleMastery('114', questions, p, course.id)).toEqual({ average: 5, label: '熟練' });
    expect(articleMastery('52', questions, p, course.id).average).toBeCloseTo(5 / 3);
    expect(articleMastery('52', questions, p, course.id).label).toBe('學習中');
    expect(articleMastery('1', questions, p, course.id)).toEqual({ average: 0, label: '未練' });
    expect(articleMastery('52', questions, emptyProgress(), course.id).label).toBe('未練');
  });
});
describe('deadline mode', () => {
  it('filters deadline tags deterministically and handles an empty pool', () => {
    const mixed = [...questions, { ...questions[0], id: 'not-deadline', tags: [] }];
    expect(deadlineQuestions(mixed, 42)).toHaveLength(5);
    expect(deadlineQuestions(mixed, 42)).toEqual(deadlineQuestions(mixed, 42));
    expect(deadlineQuestions([], 0)).toEqual([]);
  });
  it('counts down sixty seconds and never goes negative', () => {
    expect(deadlineRemaining(1000, 1000)).toBe(60);
    expect(deadlineRemaining(1000, 60999)).toBe(1);
    expect(deadlineRemaining(1000, 61000)).toBe(0);
    expect(deadlineRemaining(1000, 999999)).toBe(0);
  });
  it('records only a better score per course', () => {
    const p = recordBest(emptyProgress(), 'patent', 12);
    expect(recordBest(p, 'patent', 10).bestScores.patent).toBe(12);
    expect(recordBest(p, 'patent', 13).bestScores.patent).toBe(13);
    expect(recordBest(p, 'other', 2).bestScores).toEqual({ patent: 12, other: 2 });
  });
});
