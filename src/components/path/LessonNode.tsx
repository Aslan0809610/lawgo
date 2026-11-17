import { Link } from 'react-router-dom';
import type { Lesson } from '../../types';

interface LessonNodeProps {
  courseId: string;
  lesson: Lesson;
  crown: number;
  unlocked: boolean;
  hasQuestions: boolean;
  current: boolean;
  index: number;
}

function lessonStatus(unlocked: boolean, hasQuestions: boolean, crown: number): string {
  if (!unlocked) return '尚未解鎖';
  if (!hasQuestions) return '題庫準備中';
  return crown > 0 ? `皇冠 ${crown} 級` : '開始學習';
}

export function LessonNode({
  courseId,
  lesson,
  crown,
  unlocked,
  hasQuestions,
  current,
  index,
}: LessonNodeProps) {
  const available = unlocked && hasQuestions;
  const label = lessonStatus(unlocked, hasQuestions, crown);
  const icon = unlocked ? (crown > 0 ? '♛' : '⚒') : '⌑';
  const className = [
    'path-stop',
    `stop-${index % 4}`,
    current ? 'current' : '',
    available ? '' : 'locked',
  ]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      <span className="node-face">{icon}</span>
      <span className="node-crowns" aria-hidden="true">
        {crown > 0 ? '♛'.repeat(crown) : '· · ·'}
      </span>
      <strong>{lesson.title}</strong>
      <small>{label}</small>
      {current && available && <span className="start-pill">從這裡開始</span>}
    </>
  );

  return (
    <div className={className}>
      {available ? (
        <Link
          className="lesson-node"
          to={`/${courseId}/lesson/${lesson.id}`}
          aria-label={`${lesson.title}，${label}`}
        >
          {content}
        </Link>
      ) : (
        <div className="lesson-node" aria-disabled="true">
          {content}
        </div>
      )}
    </div>
  );
}
