import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { caseBrief } from '../test/caseContent';
import { caseContent, caseQuestion, cases } from '../test/caseContent';
import { CasePreview } from './CasePreview';

// Preview does not construct a session or consume an answer until the learner starts.
describe('case preview', () => {
  it('shows brief sections and key rule, advances through every case, and starts once', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(
      <CasePreview
        cases={cases.articles}
        briefs={caseContent.briefs}
        language="en"
        onStart={onStart}
      />,
    );
    for (const name of ['事實', '爭點', '判決', '意義']) {
      expect(screen.getByRole('heading', { name })).toBeInTheDocument();
    }
    expect(screen.getByText((_, element) => element?.className === 'key-rule')).toHaveTextContent(
      caseBrief.keyRule,
    );
    expect(screen.queryByText(caseQuestion.prompt)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一個' }));
    expect(screen.getByRole('heading', { name: cases.articles[1].label })).toBeInTheDocument();
    expect(screen.getByText(cases.articles[1].text)).toHaveAttribute('lang', 'en');
    expect(onStart).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '開始挑戰' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('can skip immediately and swipe backward or forward without starting by accident', async () => {
    const onStart = vi.fn();
    const { container } = render(<CasePreview cases={cases.articles} onStart={onStart} />);
    const card = container.querySelector('article')!;
    fireEvent.touchStart(card, { changedTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 20 }] });
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    fireEvent.touchStart(card, { changedTouches: [{ clientX: 20 }] });
    fireEvent.touchEnd(card, { changedTouches: [{ clientX: 200 }] });
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '略過' }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
