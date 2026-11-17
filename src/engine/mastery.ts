import type { Progress, Question } from '../types';
import { key } from './progress';
import { questionsForEvidence, type EvidenceKind } from './evidence';

interface ArticleMastery {
  average: number;
  label: '未練' | '學習中' | '熟練';
}

function evidenceMastery(
  kind: EvidenceKind,
  id: string,
  questions: Question[],
  progress: Progress,
  courseId: string,
): ArticleMastery {
  const related = questionsForEvidence(kind, id, questions);
  if (related.length === 0) return { average: 0, label: '未練' };

  const totalBoxes = related.reduce(
    (sum, question) => sum + (progress.questions[key(courseId, question.id)]?.box ?? 0),
    0,
  );
  const average = totalBoxes / related.length;
  if (average === 0) return { average, label: '未練' };
  return { average, label: average >= 4 ? '熟練' : '學習中' };
}

export function articleMastery(
  article: string,
  questions: Question[],
  progress: Progress,
  courseId: string,
): ArticleMastery {
  return evidenceMastery('article', article, questions, progress, courseId);
}

export function caseMastery(
  caseId: string,
  questions: Question[],
  progress: Progress,
  courseId: string,
): ArticleMastery {
  return evidenceMastery('case', caseId, questions, progress, courseId);
}
