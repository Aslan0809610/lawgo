import type { Question } from '../types';

export type EvidenceKind = 'article' | 'case';

export function questionsForEvidence(
  kind: EvidenceKind,
  id: string,
  questions: Question[],
): Question[] {
  return questions.filter((question) => question.evidence.some((entry) => entry[kind] === id));
}
