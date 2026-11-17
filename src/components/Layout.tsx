import { useEffect } from 'react';
import { Outlet, useOutletContext, useParams } from 'react-router-dom';
import { catalog } from '../content';
import { progressStore, useProgress } from '../store';
import type { CourseContent } from '../types';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { coursePreference } from '../store/coursePreference';

export const useContent = () => useOutletContext<CourseContent>();

export function Layout() {
  const { courseId } = useParams();
  const progress = useProgress();
  const content = catalog.find(({ course }) => course.id === courseId);

  useEffect(() => {
    if (content) coursePreference.remember(content.course.id);
  }, [content]);

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
      {content.demo && (
        <div className="demo-banner">示範題庫 · 正式題庫尚未載入，先體驗五種玩法。</div>
      )}
      {error && (
        <p className="storage-error" role="alert">
          {error}
        </p>
      )}
      <main>
        <Outlet key={content.course.id} context={content} />
      </main>
      <BottomNav base={base} />
    </div>
  );
}
