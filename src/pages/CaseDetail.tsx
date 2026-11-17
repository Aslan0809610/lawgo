import { Link, useParams } from 'react-router-dom';
import { highlightedText } from '../components/ArticleCard';
import { CaseBriefSections } from '../components/CaseBriefSections';
import { useContent } from '../components/Layout';
import { caseMastery, questionsForEvidence } from '../engine';
import { useProgress } from '../store';

export function CaseDetail() {
  const { caseId } = useParams();
  const { course, cases, briefs, questions, law } = useContent();
  const progress = useProgress();
  const item = cases?.articles.find((candidate) => candidate.no === caseId);
  const base = `/${course.id}`;
  if (!item)
    return (
      <section className="empty">
        <h1>找不到這個判例</h1>
        <Link to={`${base}/articles?view=cases`}>返回判例庫</Link>
      </section>
    );
  const brief = briefs?.[item.no];
  const related = questionsForEvidence('case', item.no, questions);
  const mastery = caseMastery(item.no, questions, progress, course.id);
  const quotes = related.flatMap((question) =>
    question.evidence.filter((entry) => entry.case === item.no).map((entry) => entry.quote),
  );
  return (
    <>
      <Link className="back-link" to={`${base}/articles?view=cases`}>
        ← 返回判例庫
      </Link>
      <article className="article-detail">
        <div className="eyebrow">{item.court}</div>
        <h1>{brief?.nameZh ?? item.label}</h1>
        <p>
          {item.title} · {item.year} · {item.citation}
        </p>
        <span className={`mastery mastery-${mastery.label}`}>
          {mastery.label} · 平均盒子 {mastery.average.toFixed(1)} / 5
        </span>
        {brief && <CaseBriefSections brief={brief} />}
        {!!brief?.relatedArticles.length && (
          <section className="related-links">
            <h2>相關條文</h2>
            {brief.relatedArticles.map((no) => (
              <Link key={no} to={`${base}/articles/${no}`}>
                {law.articles.find((article) => article.no === no)?.label ?? no}
              </Link>
            ))}
          </section>
        )}
        <h2>判例原文</h2>
        <div className="article-text" lang={course.language ?? 'zh'}>
          {highlightedText(item.text, quotes)}
        </div>
      </article>
      {related.length ? (
        <Link className="primary" to={`${base}/practice/case?case=${item.no}`}>
          練習這個判例 · {Math.min(10, related.length)} 題
        </Link>
      ) : (
        <p className="notice">這個判例的題庫準備中。</p>
      )}
      <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer">
        查看判例來源 ↗
      </a>
    </>
  );
}
