import { Link, useParams } from 'react-router-dom';
import { highlightedText } from '../components/ArticleCard';
import { useContent } from '../components/Layout';
import { articleMastery } from '../engine';
import { useProgress } from '../store';

export function ArticleDetail() {
  const { no } = useParams();
  const { course, law, questions } = useContent();
  const progress = useProgress();
  const article = law.articles.find((a) => a.no === no);
  const base = `/${course.id}`;
  if (!article)
    return (
      <section className="empty">
        <h1>找不到這一條</h1>
        <Link to={`${base}/articles`}>返回條文庫</Link>
      </section>
    );
  const related = questions.filter((q) => q.evidence.some((e) => e.article === no));
  const mastery = articleMastery(article.no, questions, progress, course.id);
  return (
    <>
      <Link className="back-link" to={`${base}/articles`}>
        ← 返回條文書房
      </Link>
      <article className="article-detail">
        <div className="eyebrow">
          {course.title} · {article.chapter}
        </div>
        <h1>{article.label}</h1>
        <span className={`mastery mastery-${mastery.label}`}>
          {mastery.label} · 平均盒子 {mastery.average.toFixed(1)} / 5
        </span>
        {article.section && <p className="muted-text">{article.section}</p>}
        <div className="article-text">
          {highlightedText(
            article.text,
            related.flatMap((q) => q.evidence.filter((e) => e.article === no).map((e) => e.quote)),
          )}
        </div>
        <p className="article-legend">金色標示為題目引用的重點片段。</p>
      </article>
      {related.length ? (
        <Link className="primary" to={`${base}/practice/article?article=${article.no}`}>
          練習這一條 · {Math.min(10, related.length)} 題
        </Link>
      ) : (
        <p className="notice">這一條的練習題準備中，先閱讀原文吧。</p>
      )}
      <a className="source-link" href={law.source} target="_blank" rel="noreferrer">
        查看官方來源 ↗
      </a>
    </>
  );
}
