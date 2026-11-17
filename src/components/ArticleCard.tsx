import type { ReactNode } from 'react';
import type { Article, Law, Question } from '../types';
export function highlightedText(text: string, quotes: string[]): ReactNode[] {
  let compact = '';
  const positions: number[] = [];
  for (let i = 0; i < text.length; i++)
    if (!/\s/u.test(text[i])) {
      compact += text[i];
      positions.push(i);
    }
  const marked = new Set<number>();
  for (const quote of quotes) {
    const needle = quote.replace(/\s/gu, '');
    if (!needle) continue;
    let from = 0;
    let at = compact.indexOf(needle);
    while (at >= 0) {
      for (let i = positions[at]; i <= positions[at + needle.length - 1]; i++) marked.add(i);
      from = at + needle.length;
      at = compact.indexOf(needle, from);
    }
  }
  const parts: ReactNode[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++)
    if (i === text.length || marked.has(i) !== marked.has(start)) {
      const part = text.slice(start, i);
      parts.push(marked.has(start) ? <mark key={start}>{part}</mark> : part);
      start = i;
    }
  return parts;
}
export function ArticleCard({ article, quotes = [] }: { article: Article; quotes?: string[] }) {
  return (
    <details className="article-card">
      <summary>
        條文卡 · {article.label}
        <span className="when-closed">展開全文 ＋</span>
        <span className="when-open">收合 －</span>
      </summary>
      <p className="article-text">{highlightedText(article.text, quotes)}</p>
    </details>
  );
}
export function EvidenceCards({ question, law }: { question: Question; law: Law }) {
  return (
    <>
      {[...new Set(question.evidence.map((e) => e.article))].map((no) => {
        const article = law.articles.find((a) => a.no === no);
        return article ? (
          <ArticleCard
            key={no}
            article={article}
            quotes={question.evidence.filter((e) => e.article === no).map((e) => e.quote)}
          />
        ) : (
          <p key={no}>找不到第 {no} 條</p>
        );
      })}
    </>
  );
}
