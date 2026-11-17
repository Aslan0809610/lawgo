import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import fixtures from '../../../content/fixtures/sample-questions.json';
import type { Question } from '../../types';
import { QuestionRenderer } from './index';
const questions = fixtures as Question[];
const check = () => screen.getByRole('button', { name: '檢查' });
describe('five interactive question types', () => {
  it.each([true, false])('true_false correct=%s', async (correct) => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    render(<QuestionRenderer question={questions[0]} onAnswer={onAnswer} />);
    expect(check()).toBeDisabled();
    await user.click(screen.getByRole('button', { name: correct ? /錯誤/ : /正確/ }));
    await user.click(check());
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(correct);
    expect(check()).toBeDisabled();
  });
  it.each([true, false])(
    'single_choice maps shuffled choices back to the original index; correct=%s',
    async (correct) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      const q = questions[1];
      if (q.type !== 'single_choice') throw new Error();
      render(<QuestionRenderer question={q} onAnswer={onAnswer} />);
      expect(check()).toBeDisabled();
      const text = q.options[correct ? q.answerIndex : 0];
      await user.click(screen.getByRole('button', { name: new RegExp(text) }));
      await user.click(check());
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(correct);
    },
  );
  it.each([true, false])(
    'cloze fills blanks, returns chips and grades correct=%s',
    async (correct) => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      render(<QuestionRenderer question={questions[2]} onAnswer={onAnswer} />);
      expect(check()).toBeDisabled();
      const bank = within(screen.getByRole('group', { name: '字詞庫' }));
      await user.click(bank.getByRole('button', { name: '申請日' }));
      expect(bank.getByRole('button', { name: '申請日' })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: '空格 1：申請日' }));
      expect(bank.getByRole('button', { name: '申請日' })).toBeEnabled();
      await user.click(bank.getByRole('button', { name: correct ? '申請日' : '公告日' }));
      await user.click(bank.getByRole('button', { name: '二十' }));
      await user.click(check());
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(correct);
    },
  );
  it.each([true, false])(
    'match lets the user finish after a wrong pair; correct=%s',
    async (correct) => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();
      const q = questions[3];
      if (q.type !== 'match') throw new Error();
      render(<QuestionRenderer question={q} onAnswer={onAnswer} />);
      expect(check()).toBeDisabled();
      if (!correct) {
        await user.click(screen.getByRole('button', { name: `左欄：${q.pairs[0].left}` }));
        await user.click(screen.getByRole('button', { name: `右欄：${q.pairs[1].right}` }));
        expect(screen.getByRole('status')).toHaveTextContent('配對不正確');
        expect(onAnswer).not.toHaveBeenCalled();
      }
      for (const pair of q.pairs) {
        await user.click(screen.getByRole('button', { name: `左欄：${pair.left}` }));
        await user.click(screen.getByRole('button', { name: `右欄：${pair.right}` }));
      }
      await user.click(check());
      expect(onAnswer).toHaveBeenCalledExactlyOnceWith(correct);
    },
  );
  it.each([true, false])('order appends/removes items and grades correct=%s', async (correct) => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const q = questions[4];
    if (q.type !== 'order') throw new Error();
    render(<QuestionRenderer question={q} onAnswer={onAnswer} />);
    expect(check()).toBeDisabled();
    const row = screen.getByRole('group', { name: '已排步驟' });
    await user.click(screen.getByRole('button', { name: q.items[0] }));
    await user.click(within(row).getByRole('button'));
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
    const sequence = correct ? q.items : [...q.items].reverse();
    for (const text of sequence) await user.click(screen.getByRole('button', { name: text }));
    await user.click(check());
    expect(onAnswer).toHaveBeenCalledExactlyOnceWith(correct);
  });
});
