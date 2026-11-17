import { catalog } from '../content';
import { CourseSwitcher } from '../components/CourseSwitcher';
import { useContent } from '../components/Layout';
import { CourseHero } from '../components/path/CourseHero';
import { UnitPath } from '../components/path/UnitPath';
import { isLessonUnlocked, key } from '../engine';
import { useProgress } from '../store';

export function Path() {
  const content = useContent();
  const { course, questions } = content;
  const progress = useProgress();
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const completed = lessons.filter(
    (lesson) => (progress.crowns[key(course.id, lesson.id)] ?? 0) > 0,
  ).length;
  const nextLesson = lessons.find(
    (lesson) =>
      (progress.crowns[key(course.id, lesson.id)] ?? 0) === 0 &&
      isLessonUnlocked(course, lesson.id, progress.crowns),
  );

  return (
    <>
      <CourseSwitcher courses={catalog.map((item) => item.course)} />
      <p className="muted-text">本課累積 {progress.courseXp[course.id] ?? 0} XP</p>
      <CourseHero course={course} completed={completed} total={lessons.length} />
      <div className="section-heading">
        <h2>你的學習旅程</h2>
        <span>循序漸進 · 反覆熟記</span>
      </div>
      {questions.length === 0 && (
        <p className="notice">題庫準備中，現在可以先到「條文」閱讀全文。</p>
      )}
      {course.units.map((unit, index) => (
        <UnitPath
          key={unit.id}
          content={content}
          unit={unit}
          index={index}
          progress={progress}
          nextLessonId={nextLesson?.id}
        />
      ))}
      <p className="page-footnote">每一次練習，都離熟練更近一步。</p>
    </>
  );
}
