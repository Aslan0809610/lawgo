import type { Progress, Question, Session } from '../types';
import { key } from './progress';
import { seededRng, shuffle } from './random';

function difficultyAllowed(question: Question, crown: number): boolean {
  if (crown === 0) return question.difficulty <= 2;
  if (crown === 1) return true;
  return question.difficulty >= 2;
}

function questionPriority(question: Question, progress: Progress, courseId: string): number {
  const previous = progress.questions[key(courseId, question.id)];
  if (!previous || previous.attempts === 0) return 0;
  return previous.wrong > 0 ? 1 : 2;
}

export function buildSession(
  questions: Question[],
  progress: Progress,
  courseId: string,
  crown: number,
  seed: number,
  count = 10,
  allDifficulties = false,
): Question[] {
  const eligible = questions.filter(
    (question) => allDifficulties || difficultyAllowed(question, crown),
  );
  const randomized = shuffle(eligible, seededRng(seed));
  randomized.sort(
    (left, right) =>
      questionPriority(left, progress, courseId) - questionPriority(right, progress, courseId),
  );
  return randomized.slice(0, count);
}

export function startSession(questions: Question[], now: Date): Session {
  return {
    queue: [...questions],
    initialCount: questions.length,
    hearts: 5,
    attempts: 0,
    correct: 0,
    firstAnswers: {},
    status: questions.length ? 'active' : 'complete',
    startedAt: now.getTime(),
  };
}

export function answerSession(session: Session, correct: boolean): Session {
  if (session.status !== 'active') return session;
  const [question, ...rest] = session.queue;
  const hearts = session.hearts - (correct ? 0 : 1);
  const queue = correct ? rest : [...rest, question];
  let status: Session['status'] = 'active';
  if (hearts === 0) status = 'failed';
  else if (queue.length === 0) status = 'complete';

  return {
    ...session,
    queue,
    hearts,
    attempts: session.attempts + 1,
    correct: session.correct + Number(correct),
    firstAnswers: {
      ...session.firstAnswers,
      [question.id]: session.firstAnswers[question.id] ?? correct,
    },
    status,
  };
}
