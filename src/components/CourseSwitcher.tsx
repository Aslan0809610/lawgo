import { NavLink } from 'react-router-dom';
import type { Course } from '../types';

export function CourseSwitcher({ courses }: { courses: Course[] }) {
  if (courses.length < 2) return null;
  return (
    <nav className="course-switcher" aria-label="學習課程">
      {courses.map((course) => (
        <NavLink key={course.id} to={`/${course.id}/path`}>
          {course.id === 'patent' ? '🇹🇼 ' : course.id === 'us-patent' ? '🇺🇸 ' : '⚖ '}
          {course.title}
        </NavLink>
      ))}
    </nav>
  );
}
