import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import courseJson from '../../content/courses/patent/course.json';
import law from '../../content/laws/patent/articles.json';
import fixtures from '../../content/fixtures/sample-questions.json';
import { key } from '../engine';
import { progressStore } from '../store';
import type { Course, CourseContent, Question } from '../types';
import { Lesson } from './Lesson';
import { Result } from './Result';

const course = courseJson as Course;

const firstQuestion = {
  ...fixtures[0],
  id: 'u01-l1-q01',
  lessonId: 'u01-l1',
} as Question;

function renderLesson(questions: Question[], path = '/patent/lesson/u01-l1') {
  const content: CourseContent = { course, law, questions, demo: false };
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/patent" element={<Outlet context={content} />}>
          <Route path="lesson/:lessonId" element={<Lesson />} />
          <Route path="result" element={<Result />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => progressStore.reset());

describe('lesson lifecycle', () => {
  it('requeues a wrong answer, persists its first try and rewards completion once', async () => {
    const user = userEvent.setup();
    const secondQuestion = { ...firstQuestion, id: 'u01-l1-q02', prompt: '第二題' };
    renderLesson([firstQuestion, secondQuestion]);

    await user.click(screen.getByRole('button', { name: /正確/ }));
    await user.click(screen.getByRole('button', { name: '檢查' }));
    expect(screen.getByLabelText('剩餘 4 顆愛心')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '繼續' }));
    for (let index = 0; index < 2; index++) {
      await user.click(screen.getByRole('button', { name: /錯誤/ }));
      await user.click(screen.getByRole('button', { name: '檢查' }));
      await user.click(screen.getByRole('button', { name: '繼續' }));
    }

    expect(screen.getByRole('heading', { name: '練習完成！' })).toBeInTheDocument();
    const progress = progressStore.getSnapshot();
    expect(progress.totalXp).toBe(10);
    expect(progress.sessionsCompleted).toBe(1);
    expect(progress.crowns[key('patent', 'u01-l1')]).toBe(1);
    const answers = Object.values(progress.questions);
    expect(answers.every((answer) => answer.attempts === 1)).toBe(true);
    expect(answers.filter((answer) => answer.wrong === 1)).toHaveLength(1);
    expect(screen.getByText('67%')).toBeInTheDocument();
  });

  it('ends at five errors without XP or a crown', async () => {
    const user = userEvent.setup();
    renderLesson([firstQuestion]);
    for (let index = 0; index < 5; index++) {
      await user.click(screen.getByRole('button', { name: /正確/ }));
      await user.click(screen.getByRole('button', { name: '檢查' }));
      await user.click(screen.getByRole('button', { name: '繼續' }));
    }
    expect(screen.getByRole('heading', { name: '愛心用完了' })).toBeInTheDocument();
    expect(progressStore.getSnapshot().totalXp).toBe(0);
    expect(progressStore.getSnapshot().crowns).toEqual({});
    expect(progressStore.getSnapshot().sessionsCompleted).toBe(0);
    expect(screen.getByRole('link', { name: '再試一次' })).toHaveAttribute(
      'href',
      '/patent/lesson/u01-l1',
    );
  });

  it('guards a locked lesson when opened directly', () => {
    renderLesson([firstQuestion], '/patent/lesson/u01-l2');
    expect(screen.getByRole('heading', { name: '這個練習尚未解鎖' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '檢查' })).not.toBeInTheDocument();
  });

  it('handles a missing question pool without granting progress', () => {
    renderLesson([]);
    expect(screen.getByRole('heading', { name: '目前沒有可練習的題目' })).toBeInTheDocument();
    expect(progressStore.getSnapshot().totalXp).toBe(0);
  });
});
