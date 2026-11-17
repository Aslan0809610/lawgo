import type { Case, CaseBrief, Course } from '../types';
import { highlightedText } from './highlightedText';

export function CaseCard({
  caseLaw,
  brief,
  quotes = [],
  language = 'zh',
}: {
  caseLaw: Case;
  brief?: CaseBrief;
  quotes?: string[];
  language?: Course['language'];
}) {
  return (
    <section className="case-card" aria-label="判例卡">
      <h3>🔨 判例卡 · {brief?.nameZh ?? caseLaw.label}</h3>
      <p className="muted-text">
        {caseLaw.year} · {caseLaw.citation}
      </p>
      {brief?.holding && <p>判決：{brief.holding}</p>}
      {quotes.map((quote, index) => (
        <blockquote className="article-text" lang={language} key={index}>
          {highlightedText(quote, [quote])}
        </blockquote>
      ))}
      <details className="article-card">
        <summary>展開判例全文</summary>
        <p className="article-text" lang={language}>
          {highlightedText(caseLaw.text, quotes)}
        </p>
      </details>
    </section>
  );
}
