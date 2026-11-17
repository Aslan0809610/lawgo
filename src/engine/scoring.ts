import type { Question, Session } from '../types';

export type Answer = boolean | number | string[] | { left: string; right: string }[];

export function checkAnswer(question: Question, answer: Answer): boolean {
  switch (question.type) {
    case 'true_false':
      return answer === question.answer;
    case 'single_choice':
      return answer === question.answerIndex;
    case 'cloze':
      return (
        Array.isArray(answer) &&
        answer.length === question.blanks.length &&
        question.blanks.every((v, i) => v === answer[i])
      );
    case 'order':
      return (
        Array.isArray(answer) &&
        answer.length === question.items.length &&
        question.items.every((v, i) => v === answer[i])
      );
    case 'match':
      return (
        Array.isArray(answer) &&
        answer.length === question.pairs.length &&
        question.pairs.every((p) =>
          answer.some((a) => typeof a === 'object' && a.left === p.left && a.right === p.right),
        )
      );
  }
}

export function sessionXp(session: Session): number {
  return session.status === 'complete' && session.initialCount > 0
    ? 10 + (session.hearts === 5 ? 5 : 0)
    : 0;
}
