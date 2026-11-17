import { dueReviews, isLessonUnlocked, isUnitUnlocked, key, questionsForEvidence } from '../engine';
import type { CourseContent, PracticeConfig, Progress } from '../types';

interface PracticeParams {
  lessonId?: string;
  unitId?: string;
  kind?: string;
}

export function resolvePractice(
  content: CourseContent,
  progress: Progress,
  params: PracticeParams,
  search: string,
  now: Date,
): PracticeConfig {
  const { course, questions, demo } = content;
  const base = `/${course.id}`;
  const defaults: PracticeConfig = {
    courseId: course.id,
    pool: [],
    title: '找不到這個練習',
    mode: 'lesson',
    crown: 0,
    allowed: false,
    returnTo: `${base}/path`,
  };

  if (params.lessonId) {
    const lesson = course.units
      .flatMap((unit) => unit.lessons)
      .find((item) => item.id === params.lessonId);
    if (!lesson) return defaults;
    return {
      ...defaults,
      title: lesson.title,
      lessonId: lesson.id,
      caseIds: lesson.cases,
      allowed: isLessonUnlocked(course, lesson.id, progress.crowns),
      pool: demo ? questions : questions.filter((question) => question.lessonId === lesson.id),
      crown: progress.crowns[key(course.id, lesson.id)] ?? 0,
    };
  }

  if (params.unitId) {
    const unit = course.units.find((item) => item.id === params.unitId);
    if (!unit) return defaults;
    const lessonIds = new Set(unit.lessons.map((lesson) => lesson.id));
    return {
      ...defaults,
      mode: 'unit',
      title: `${unit.title} · 單元挑戰`,
      caseIds: [...new Set(unit.lessons.flatMap((lesson) => lesson.cases ?? []))],
      allowed: isUnitUnlocked(course, unit.id, progress.crowns),
      pool: demo ? questions : questions.filter((question) => lessonIds.has(question.lessonId)),
    };
  }

  const reviewConfig: PracticeConfig = {
    ...defaults,
    mode: 'review',
    allowed: true,
    returnTo: `${base}/review`,
  };
  const article = new URLSearchParams(search).get('article');
  if (params.kind === 'article' && article) {
    return {
      ...reviewConfig,
      mode: 'article',
      title: `第 ${article} 條練習`,
      pool: questionsForEvidence('article', article, questions),
      returnTo: `${base}/articles/${article}`,
    };
  }
  const caseId = new URLSearchParams(search).get('case');
  if (params.kind === 'case' && caseId) {
    const item = content.cases?.articles.find((candidate) => candidate.no === caseId);
    return {
      ...reviewConfig,
      mode: 'case',
      allowed: !!item,
      title: `${content.briefs?.[caseId]?.nameZh ?? item?.label ?? caseId} · 判例練習`,
      caseIds: [caseId],
      pool: questionsForEvidence('case', caseId, questions),
      returnTo: `${base}/cases/${caseId}`,
    };
  }
  if (params.kind === 'due') {
    return {
      ...reviewConfig,
      title: '到期複習',
      pool: dueReviews(questions, course, progress, now),
    };
  }
  if (params.kind === 'wrong') {
    return {
      ...reviewConfig,
      title: '錯題練習',
      pool: questions.filter(
        (question) =>
          progress.questions[key(course.id, question.id)]?.box === 1 &&
          isLessonUnlocked(course, question.lessonId, progress.crowns),
      ),
    };
  }
  return defaults;
}
