import type { Course, Progress, Question, QuestionProgress } from '../types';
import { addDays, localDate } from './dates';
import { isLessonUnlocked, key } from './progress';

export const INTERVALS = [0, 1, 2, 4, 7, 15] as const;

export function scheduleReview(
  previous: QuestionProgress | undefined,
  correct: boolean,
  now: Date,
): QuestionProgress {
  const box = correct ? Math.min(5, (previous?.box ?? 0) + 1) : 1;
  return {
    box,
    due: addDays(now, INTERVALS[box]),
    attempts: (previous?.attempts ?? 0) + 1,
    correct: (previous?.correct ?? 0) + Number(correct),
    wrong: (previous?.wrong ?? 0) + Number(!correct),
  };
}

export function dueReviews(
  questions: Question[],
  course: Course,
  progress: Progress,
  now: Date,
): Question[] {
  return questions
    .filter((q) => {
      const p = progress.questions[key(course.id, q.id)];
      return (
        !!p && p.due <= localDate(now) && isLessonUnlocked(course, q.lessonId, progress.crowns)
      );
    })
    .sort((a, b) =>
      progress.questions[key(course.id, a.id)].due.localeCompare(
        progress.questions[key(course.id, b.id)].due,
      ),
    )
    .slice(0, 10);
}
