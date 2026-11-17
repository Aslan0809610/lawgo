import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { catalog } from './content';
import { Articles } from './pages/Articles';
import { ArticleDetail } from './pages/ArticleDetail';
import { DeadlineChallenge } from './pages/DeadlineChallenge';
import { Lesson } from './pages/Lesson';
import { Path } from './pages/Path';
import { Profile } from './pages/Profile';
import { Result } from './pages/Result';
import { Review } from './pages/Review';
import './style.css';
class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="empty">
        <h1>畫面暫時無法載入</h1>
        <p>你的已存進度仍在。請重新整理再試一次。</p>
        <button className="primary" onClick={() => window.location.reload()}>
          重新整理
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            catalog[0] ? (
              <Navigate to={`/${catalog[0].course.id}/path`} replace />
            ) : (
              <main className="empty">
                <h1>課程準備中</h1>
              </main>
            )
          }
        />
        <Route path="/:courseId" element={<Layout />}>
          <Route index element={<Navigate to="path" replace />} />
          <Route path="path" element={<Path />} />
          <Route path="lesson/:lessonId" element={<Lesson />} />
          <Route path="challenge/:unitId" element={<Lesson />} />
          <Route path="practice/:kind" element={<Lesson />} />
          <Route path="result" element={<Result />} />
          <Route path="review" element={<Review />} />
          <Route path="articles" element={<Articles />} />
          <Route path="articles/:no" element={<ArticleDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="deadline" element={<DeadlineChallenge />} />
        </Route>
        <Route
          path="*"
          element={
            <main className="empty">
              <h1>這一頁還沒找到</h1>
              <Link to="/">回到學習</Link>
            </main>
          }
        />
      </Routes>
    </HashRouter>
  );
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
