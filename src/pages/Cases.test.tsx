import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom';
import { progressStore } from '../store';
import { caseContent, caseLaw, caseQuestion } from '../test/caseContent';
import type { CourseContent } from '../types';
import { ArticleDetail } from './ArticleDetail';
import { Articles } from './Articles';
import { CaseDetail } from './CaseDetail';
import { Lesson } from './Lesson';
import { Result } from './Result';

function app(path: string, content: CourseContent = caseContent) {
  return render(
    <MemoryRouter
      initialEntries={[`/test-us/${path}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/test-us" element={<Outlet context={content} />}>
          <Route path="articles" element={<Articles />} />
          <Route path="articles/:no" element={<ArticleDetail />} />
          <Route path="cases/:caseId" element={<CaseDetail />} />
          <Route path="lesson/:lessonId" element={<Lesson />} />
          <Route path="practice/:kind" element={<Lesson />} />
          <Route path="result" element={<Result />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => progressStore.reset());

describe('case library and practice routes', () => {
  it('sorts by year, searches briefs, links articles both ways, and starts case practice', async () => {
    const user = userEvent.setup();
    app('articles');
    await user.click(screen.getByRole('button', { name: '判例' }));
    const library = screen.getByRole('region', { name: '判例庫' });
    const links = within(library).getAllByRole('link');
    expect(links[0]).toHaveTextContent('Mayo');
    expect(links[1]).toHaveTextContent('Alice');
    await user.type(screen.getByRole('searchbox', { name: '搜尋判例' }), '發明概念');
    expect(within(library).getAllByRole('link')).toHaveLength(1);
    await user.click(within(library).getByRole('link'));
    expect(screen.getByRole('heading', { name: 'Alice 案' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '事實' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: '§ 101' }));
    expect(screen.getByRole('heading', { name: '§ 101' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Alice 案/ }));
    await user.click(screen.getByRole('link', { name: /練習這個判例/ }));
    expect(screen.getByRole('region', { name: '案例速覽' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '開始挑戰' }));
    expect(screen.getByRole('heading', { name: caseQuestion.prompt })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /錯誤/ }));
    await user.click(screen.getByRole('button', { name: '檢查' }));
    expect(screen.getByRole('region', { name: '判例卡' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '繼續' }));
    expect(screen.getByRole('heading', { name: '練習完成！' })).toBeInTheDocument();
    expect(progressStore.getSnapshot().courseXp['test-us']).toBe(15);
    expect(progressStore.getSnapshot().crowns).toEqual({});
  });

  it.each(['略過', '開始挑戰'])('starts the lesson after preview using %s', async (action) => {
    const user = userEvent.setup();
    app('lesson/c01-l1');
    expect(screen.queryByRole('heading', { name: caseQuestion.prompt })).not.toBeInTheDocument();
    if (action === '開始挑戰') {
      await user.click(screen.getByRole('button', { name: '下一個' }));
      expect(screen.getByRole('heading', { name: 'Mayo v. Prometheus' })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: action }));
    expect(screen.getByRole('heading', { name: caseQuestion.prompt })).toBeInTheDocument();
    expect(progressStore.getSnapshot().sessionsCompleted).toBe(0);
  });

  it('renders original case text without briefs or questions', () => {
    app('cases/alice', { ...caseContent, briefs: undefined, questions: [] });
    expect(screen.getByRole('heading', { name: caseLaw.label })).toBeInTheDocument();
    expect(screen.getByText(caseLaw.text)).toBeInTheDocument();
    expect(screen.getByText('這個判例的題庫準備中。')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '事實' })).not.toBeInTheDocument();
  });

  it('keeps the Taiwan-style library available without a cases toggle', () => {
    app('articles', {
      ...caseContent,
      course: { ...caseContent.course, casesFile: undefined },
      cases: undefined,
      briefs: undefined,
    });
    expect(screen.queryByRole('button', { name: '判例' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /§ 101/ })).toBeInTheDocument();
  });
});
