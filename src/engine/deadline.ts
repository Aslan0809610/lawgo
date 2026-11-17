import type { Progress, Question } from '../types';
import { seededRng, shuffle } from './random';

export function deadlineQuestions(questions: Question[], seed: number): Question[] {
  return shuffle(
    questions.filter((q) => q.tags.includes('deadline')),
    seededRng(seed),
  );
}

export function deadlineRemaining(started: number, now: number): number {
  return Math.max(0, 60 - Math.floor((now - started) / 1000));
}

export function recordBest(progress: Progress, courseId: string, score: number): Progress {
  return {
    ...progress,
    bestScores: {
      ...progress.bestScores,
      [courseId]: Math.max(progress.bestScores[courseId] ?? 0, score),
    },
  };
}
