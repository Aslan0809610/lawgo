import { useState } from 'react';
import { Link } from 'react-router-dom';
import { caseMastery } from '../engine';
import { useProgress } from '../store';
import type { CourseContent } from '../types';

export function CaseLibrary({ content }: { content: CourseContent }) {
  const { course, cases, briefs, questions } = content;
  const [query, setQuery] = useState('');
  const progress = useProgress();
  const needle = query.trim().toLocaleLowerCase();
  const filtered = [...(cases?.articles ?? [])]
    .sort((a, b) => a.year - b.year || a.label.localeCompare(b.label))
    .filter((item) => {
      const brief = briefs?.[item.no];
      const searchable = [
        item.no,
        item.label,
        item.year,
        item.citation,
        item.text,
        brief?.nameZh,
        brief?.facts,
        brief?.issue,
        brief?.holding,
        brief?.significance,
        brief?.keyRule,
      ];
      return searchable.join(' ').toLocaleLowerCase().includes(needle);
    });

  return (
    <section aria-label="判例庫">
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          aria-label="搜尋判例"
          placeholder="搜尋案名、年份或關鍵字"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <p className="muted-text">共 {filtered.length} 個判例 · 依年份排序</p>
      {filtered.length === 0 && <p className="empty">沒有符合的判例。</p>}
      <div className="article-list">
        {filtered.map((item) => {
          const brief = briefs?.[item.no];
          const mastery = caseMastery(item.no, questions, progress, course.id);
          return (
            <Link className="article-row" key={item.no} to={`/${course.id}/cases/${item.no}`}>
              <div>
                <strong>{brief?.nameZh ?? item.label}</strong>
                <span className={`mastery mastery-${mastery.label}`}>{mastery.label}</span>
                <p>
                  {item.year} · {item.citation}
                </p>
                <p
                  className={brief ? undefined : 'statute-preview'}
                  lang={brief ? 'zh' : course.language}
                >
                  {brief?.keyRule ?? item.text}
                </p>
              </div>
              <span>›</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
