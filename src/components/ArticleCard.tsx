import type { Article, CaseBriefs, Cases, Course, Law, Question } from '../types';
import { CaseCard } from './CaseCard';
import { highlightedText } from './highlightedText';
export { highlightedText } from './highlightedText';

export interface EvidenceContent {
  law: Law;
  cases?: Cases;
  briefs?: CaseBriefs;
  language?: Course['language'];
}

export function ArticleCard({
  article,
  quotes = [],
  language = 'zh',
}: {
  article: Article;
  quotes?: string[];
  language?: Course['language'];
}) {
  return (
    <details className="article-card">
      <summary>
        條文卡 · {article.label}
        <span className="when-closed">展開全文 ＋</span>
        <span className="when-open">收合 －</span>
      </summary>
      <p className="article-text" lang={language}>
        {highlightedText(article.text, quotes)}
      </p>
    </details>
  );
}

export function EvidenceCards({
  question,
  law,
  cases,
  briefs,
  language = 'zh',
}: EvidenceContent & { question: Question }) {
  const references = new Map<string, { kind: 'article' | 'case'; id: string; quotes: string[] }>();
  for (const entry of question.evidence) {
    const kind = entry.case !== undefined ? 'case' : 'article';
    const id = entry.case ?? entry.article;
    const key = `${kind}:${id}`;
    const reference = references.get(key) ?? { kind, id, quotes: [] };
    if (!reference.quotes.includes(entry.quote)) reference.quotes.push(entry.quote);
    references.set(key, reference);
  }
  return (
    <>
      {[...references.entries()].map(([key, reference]) => {
        const { kind, id, quotes } = reference;
        if (kind === 'case') {
          const item = cases?.articles.find((candidate) => candidate.no === id);
          return item ? (
            <CaseCard
              key={key}
              caseLaw={item}
              brief={briefs?.[id]}
              quotes={quotes}
              language={language}
            />
          ) : (
            <p key={key}>找不到判例 {id}</p>
          );
        }
        const article = law.articles.find((candidate) => candidate.no === id);
        return article ? (
          <ArticleCard key={key} article={article} quotes={quotes} language={language} />
        ) : (
          <p key={key}>找不到第 {id} 條</p>
        );
      })}
    </>
  );
}
