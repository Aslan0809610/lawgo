import { Link } from 'react-router-dom';
import { isLessonUnlocked, isUnitUnlocked, key } from '../../engine';
import type { CourseContent, Progress, Unit } from '../../types';
import { LessonNode } from './LessonNode';

interface UnitPathProps {
  content: CourseContent;
  unit: Unit;
  index: number;
  progress: Progress;
  nextLessonId?: string;
}

export function UnitPath({ content, unit, index, progress, nextLessonId }: UnitPathProps) {
  const { course, questions, demo } = content;
  const lessonIds = new Set(unit.lessons.map((lesson) => lesson.id));
  const hasQuestions = demo || questions.some((question) => lessonIds.has(question.lessonId));
  const challengeUnlocked = hasQuestions && isUnitUnlocked(course, unit.id, progress.crowns);

  return (
    <section className={`unit ${unit.kind === 'cases' ? 'case-unit' : ''}`}>
      <header className="unit-heading">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h2>
            {unit.kind === 'cases' && '🔨 '}
            {unit.title}
          </h2>
          {unit.kind === 'cases' && <span className="case-badge">判例關卡</span>}
          <p>{unit.description}</p>
        </div>
      </header>
      <div className="lesson-path">
        {unit.lessons.map((lesson, lessonIndex) => (
          <LessonNode
            key={lesson.id}
            caseLesson={unit.kind === 'cases'}
            courseId={course.id}
            lesson={lesson}
            crown={progress.crowns[key(course.id, lesson.id)] ?? 0}
            unlocked={isLessonUnlocked(course, lesson.id, progress.crowns)}
            hasQuestions={demo || questions.some((question) => question.lessonId === lesson.id)}
            current={lesson.id === nextLessonId}
            index={lessonIndex}
          />
        ))}
        {challengeUnlocked ? (
          <Link className="unit-challenge" to={`/${course.id}/challenge/${unit.id}`}>
            ✦ 單元挑戰 <small>15 題綜合驗收 →</small>
          </Link>
        ) : (
          <div className="unit-challenge locked" aria-disabled="true">
            ⌑ 單元挑戰 <small>完成本單元所有課程解鎖</small>
          </div>
        )}
      </div>
    </section>
  );
}
