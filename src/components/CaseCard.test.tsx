import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { caseBrief, caseContent, caseQuestion, cases } from '../test/caseContent';
import { EvidenceCards } from './ArticleCard';

describe('case evidence card', () => {
  it('renders a mixed evidence question with a brief and highlights English across whitespace', async () => {
    const item = { ...cases.articles[0], text: 'Before. An abstract\nidea is not enough. After.' };
    const question = {
      ...caseQuestion,
      evidence: [
        ...caseQuestion.evidence,
        { article: '101', quote: 'a useful process.' },
        ...caseQuestion.evidence,
      ],
    };
    const { container } = render(
      <EvidenceCards
        question={question}
        law={caseContent.law}
        cases={{ ...cases, articles: [item] }}
        briefs={caseContent.briefs}
        language="en"
      />,
    );
    const card = screen.getByRole('region', { name: '判例卡' });
    expect(screen.getAllByRole('region', { name: '判例卡' })).toHaveLength(1);
    expect(within(card).getByText(/2014.*573 U.S. 208/)).toBeInTheDocument();
    expect(within(card).getByText(`判決：${caseBrief.holding}`)).toBeInTheDocument();
    expect(screen.getByText(/條文卡 · § 101/)).toBeInTheDocument();
    await userEvent.click(within(card).getByText('展開判例全文'));
    expect(container.querySelector('details')).toHaveAttribute('open');
    const mark = within(card).getAllByText('An abstract idea is not enough.').at(-1)!;
    expect(mark.textContent).toBe('An abstract\nidea is not enough.');
    expect(mark.closest('[lang]')).toHaveAttribute('lang', 'en');
  });

  it('falls back to the case label and original text when no brief exists', async () => {
    render(
      <EvidenceCards question={caseQuestion} law={caseContent.law} cases={cases} language="en" />,
    );
    expect(screen.getByRole('heading', { name: /Alice v. CLS Bank/ })).toBeInTheDocument();
    expect(screen.queryByText(/判決：/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('展開判例全文'));
    expect(screen.getAllByText(cases.articles[0].text)).toHaveLength(2);
  });
});
