import { Outlet, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { catalog } from '../content';
import { progressStore, useProgress } from '../store';
import type { CourseContent } from '../types';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';

export const useContent = () => useOutletContext<CourseContent>();

function CourseSelector({ courseId }: { courseId: string }) {
  const navigate = useNavigate();
  if (catalog.length < 2) return null;

  return (
    <label className="course-select">
      學習課程
      <select value={courseId} onChange={(event) => navigate(`/${event.target.value}/path`)}>
        {catalog.map(({ course }) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Layout() {
  const { courseId } = useParams();
  const progress = useProgress();
  const content = catalog.find(({ course }) => course.id === courseId);

  if (!content) {
    return (
      <main className="empty">
        <h1>找不到這門課程</h1>
        <a href="#/">回到學習</a>
      </main>
    );
  }

  const base = `/${content.course.id}`;
  const error = progressStore.getError();

  return (
    <div className="app-shell">
      <TopBar base={base} progress={progress} now={progressStore.clock.now()} />
      <CourseSelector courseId={content.course.id} />
      {content.demo && (
        <div className="demo-banner">示範題庫 · 正式題庫尚未載入，先體驗五種玩法。</div>
      )}
      {error && (
        <p className="storage-error" role="alert">
          {error}
        </p>
      )}
      <main>
        <Outlet context={content} />
      </main>
      <BottomNav base={base} />
    </div>
  );
}
