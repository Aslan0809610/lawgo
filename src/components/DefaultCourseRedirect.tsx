import { Navigate } from 'react-router-dom';
import { coursePreference } from '../store/coursePreference';

export function DefaultCourseRedirect({ ids }: { ids: string[] }) {
  const id = coursePreference.read(ids);
  return id ? (
    <Navigate to={`/${id}/path`} replace />
  ) : (
    <main className="empty">
      <h1>課程準備中</h1>
    </main>
  );
}
