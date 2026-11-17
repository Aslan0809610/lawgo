import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { highlightedText } from './ArticleCard';
describe('evidence highlighting', () => {
  it('matches across whitespace and keeps original text', () => {
    const { container } = render(
      <p>
        {highlightedText('前言。\n發明專利權期限，自 申請日 起算二十年屆滿。\n結尾', [
          '發明專利權期限，自申請日起算二十年屆滿。',
        ])}
      </p>,
    );
    expect(container.querySelector('mark')?.textContent).toBe(
      '發明專利權期限，自 申請日 起算二十年屆滿。',
    );
    expect(screen.getByText(/前言/)).toHaveTextContent('結尾');
  });
  it('handles overlapping and repeated quotes', () => {
    const { container } = render(<p>{highlightedText('甲乙丙、甲乙', ['甲乙', '乙丙', ''])}</p>);
    expect([...container.querySelectorAll('mark')].map((m) => m.textContent)).toEqual([
      '甲乙丙',
      '甲乙',
    ]);
  });
});

it('keeps English word spaces and punctuation while matching line-wrapped evidence', () => {
  const text = 'Intro. Any new and\n useful process, machine, or composition. End.';
  const { container } = render(<p>{highlightedText(text, ['new and useful process, machine'])}</p>);
  expect(container.querySelector('mark')?.textContent).toBe('new and\n useful process, machine');
  expect(container.textContent).toBe(text);
});
