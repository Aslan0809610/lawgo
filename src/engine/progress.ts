import type { Course, Progress, Session } from '../types';
import { addDays, localDate } from './dates';
import { sessionXp } from './scoring';

export const key = (courseId: string, id: string): string => `${courseId}:${id}`;

export function nextCrown(current: number): number {
  return Math.min(3, current + 1);
}

export function isLessonUnlocked(
  course: Course,
  lessonId: string,
  crowns: Record<string, number>,
): boolean {
  const lessons = course.units.flatMap((u) => u.lessons);
  const index = lessons.findIndex((l) => l.id === lessonId);
  return index === 0 || (index > 0 && (crowns[key(course.id, lessons[index - 1].id)] ?? 0) >= 1);
}

export function isUnitUnlocked(
  course: Course,
  unitId: string,
  crowns: Record<string, number>,
): boolean {
  const unit = course.units.find((u) => u.id === unitId);
  return (
    !!unit &&
    unit.lessons.length > 0 &&
    unit.lessons.every((l) => (crowns[key(course.id, l.id)] ?? 0) >= 1)
  );
}

export function addXp(progress: Progress, xp: number, now: Date): Progress {
  const date = localDate(now);
  const value = (progress.dailyXp[date] ?? 0) + xp;
  return {
    ...progress,
    totalXp: progress.totalXp + xp,
    dailyXp: { ...progress.dailyXp, [date]: value },
    goalDays:
      value >= progress.dailyGoal && !progress.goalDays.includes(date)
        ? [...progress.goalDays, date]
        : progress.goalDays,
  };
}

export function streak(progress: Progress, now: Date): number {
  let offset = progress.goalDays.includes(localDate(now)) ? 0 : -1;
  let count = 0;
  while (progress.goalDays.includes(addDays(now, offset))) {
    count++;
    offset--;
  }
  return count;
}

export function setGoal(progress: Progress, goal: Progress['dailyGoal'], now: Date): Progress {
  return addXp({ ...progress, dailyGoal: goal }, 0, now);
}

/** Reward a completed nonempty round; only lesson rounds receive a crown. */
export function rewardSession(
  progress: Progress,
  session: Session,
  courseId: string,
  lessonId: string | undefined,
  now: Date,
): Progress {
  if (session.status !== 'complete' || session.initialCount === 0) return progress;
  const rewarded = addXp(progress, sessionXp(session), now);
  const crowns = { ...progress.crowns };
  if (lessonId) {
    const lessonKey = key(courseId, lessonId);
    crowns[lessonKey] = nextCrown(crowns[lessonKey] ?? 0);
  }
  return { ...rewarded, crowns, sessionsCompleted: progress.sessionsCompleted + 1 };
}
