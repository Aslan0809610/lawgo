import type { Course } from '../../types';

export function CourseHero({
  course,
  completed,
  total,
}: {
  course: Course;
  completed: number;
  total: number;
}) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <section className="hero">
      <div className="eyebrow">每天一點，讓法條成為底氣</div>
      <div className="hero-title">
        <h1>
          {course.title}
          <span>學習之路</span>
        </h1>
        <span className="hero-emblem" aria-hidden="true">
          ⚖
        </span>
      </div>
      <p>{course.subtitle ?? '循序讀懂每一條法律'}</p>
      <div className="hero-progress">
        <span style={{ width: `${percentage}%` }} />
      </div>
      <div className="hero-meta">
        <span>
          已完成 {completed} / {total} 課
        </span>
        <span>一課約 3 分鐘</span>
      </div>
    </section>
  );
}
