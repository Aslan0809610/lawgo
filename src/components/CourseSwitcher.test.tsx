import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { catalog } from '../content';
import { Path } from '../pages/Path';
import { COURSE_PREFERENCE_KEY } from '../store/coursePreference';
import { DefaultCourseRedirect } from './DefaultCourseRedirect';
import { Layout } from './Layout';

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    },
  });
});

function app() {
  return render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/"
          element={<DefaultCourseRedirect ids={catalog.map((item) => item.course.id)} />}
        />
        <Route path="/:courseId" element={<Layout />}>
          <Route path="path" element={<Path />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

it('switches the real course path, persists the choice and redirects back after a reload', async () => {
  const user = userEvent.setup();
  const first = app();
  await user.click(screen.getByRole('link', { name: '🇺🇸 美國專利法' }));
  expect(screen.getByRole('heading', { name: /美國專利法.*學習之路/ })).toBeInTheDocument();
  expect(window.localStorage.getItem(COURSE_PREFERENCE_KEY)).toBe('us-patent');
  const us = catalog.find((item) => item.course.id === 'us-patent')!;
  const pending = us.course.units
    .flatMap((unit) => unit.lessons)
    .filter((lesson) => !us.questions.some((question) => question.lessonId === lesson.id)).length;
  expect(screen.queryAllByText('題庫準備中')).toHaveLength(pending);
  expect(screen.queryAllByText('判例關卡')).toHaveLength(
    us.course.units.filter((unit) => unit.kind === 'cases').length,
  );
  first.unmount();
  app();
  expect(screen.getByRole('heading', { name: /美國專利法.*學習之路/ })).toBeInTheDocument();
});
