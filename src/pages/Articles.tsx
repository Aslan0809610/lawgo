import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../components/Layout';
import { articleMastery } from '../engine';
import { useProgress } from '../store';
import type { Article, Progress, Question } from '../types';

interface ArticleGroup {
  chapter: string;
  section: string | null;
  articles: Article[];
}

function groupArticles(articles: Article[]): ArticleGroup[] {
  const groups = new Map<string, ArticleGroup>();
  for (const article of articles) {
    const groupKey = JSON.stringify([article.chapter, article.section]);
    const group = groups.get(groupKey);
    if (group) {
      group.articles.push(article);
    } else {
      groups.set(groupKey, {
        chapter: article.chapter,
        section: article.section,
        articles: [article],
      });
    }
  }
  return [...groups.values()];
}

function ArticleRow({
  article,
  courseId,
  questions,
  progress,
}: {
  article: Article;
  courseId: string;
  questions: Question[];
  progress: Progress;
}) {
  const mastery = articleMastery(article.no, questions, progress, courseId);
  return (
    <Link className="article-row" to={`/${courseId}/articles/${article.no}`}>
      <div>
        <strong>{article.label}</strong>
        <span className={`mastery mastery-${mastery.label}`}>{mastery.label}</span>
        <p>{article.text}</p>
      </div>
      <span>›</span>
    </Link>
  );
}

export function Articles() {
  const { course, law, questions } = useContent();
  const progress = useProgress();
  const [query, setQuery] = useState('');
  const [chapter, setChapter] = useState('all');
  const normalized = query.replace(/[第條\s]/g, '');
  const filtered = law.articles.filter((article) => {
    const matchesChapter = chapter === 'all' || article.chapter === chapter;
    const matchesQuery =
      !query.trim() || article.no.includes(normalized) || article.text.includes(query.trim());
    return matchesChapter && matchesQuery;
  });
  const groups = groupArticles(filtered);
  const chapters = [...new Set(law.articles.map((article) => article.chapter))];

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">讀原文，建立自己的理解</div>
        <h1>條文書房</h1>
        <p>
          {law.law} · {law.articles.length} 條 · {law.amended} 修正
        </p>
      </div>
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="搜尋條號或關鍵字"
          placeholder="搜尋條號或關鍵字，例如 22、新穎性"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label className="chapter-select">
        依章瀏覽
        <select value={chapter} onChange={(event) => setChapter(event.target.value)}>
          <option value="all">全部章節</option>
          {chapters.map((title) => (
            <option value={title} key={title}>
              {title}
            </option>
          ))}
        </select>
      </label>
      <p className="muted-text">共 {filtered.length} 條</p>
      {filtered.length === 0 && <p className="empty">沒有符合的條文，換個關鍵字試試。</p>}
      <div className="article-list">
        {groups.map((group) => (
          <section key={JSON.stringify([group.chapter, group.section])}>
            <h2 className="article-group">
              {group.chapter}
              {group.section && <small>{group.section}</small>}
            </h2>
            {group.articles.map((article) => (
              <ArticleRow
                key={article.no}
                article={article}
                courseId={course.id}
                questions={questions}
                progress={progress}
              />
            ))}
          </section>
        ))}
      </div>
      <a className="source-link" href={law.source} target="_blank" rel="noreferrer">
        原始來源：全國法規資料庫 ↗
      </a>
    </>
  );
}
