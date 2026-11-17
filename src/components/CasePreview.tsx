import { useRef, useState } from 'react';
import type { Case, CaseBriefs, Course } from '../types';
import { CaseBriefSections } from './CaseBriefSections';

export function CasePreview({
  cases,
  briefs,
  language = 'zh',
  onStart,
}: {
  cases: Case[];
  briefs?: CaseBriefs;
  language?: Course['language'];
  onStart(): void;
}) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const item = cases[index];
  const brief = briefs?.[item.no];
  const last = index === cases.length - 1;

  function next() {
    if (last) onStart();
    else setIndex(index + 1);
  }

  return (
    <section className="case-preview" aria-label="案例速覽">
      <div className="section-heading">
        <h1>案例速覽</h1>
        <button className="skip-link" onClick={onStart}>
          略過
        </button>
      </div>
      <p aria-live="polite">
        {index + 1} / {cases.length}
      </p>
      <article
        className="case-preview-card"
        onTouchStart={(event) => {
          touchStart.current = event.changedTouches[0].clientX;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (start === null) return;
          const distance = start - event.changedTouches[0].clientX;
          if (distance > 50 && !last) setIndex(index + 1);
          if (distance < -50 && index > 0) setIndex(index - 1);
        }}
      >
        <h2>{brief?.nameZh ?? item.label}</h2>
        <p className="muted-text">
          {item.year} · {item.citation}
        </p>
        {brief ? (
          <CaseBriefSections brief={brief} />
        ) : (
          <p className="article-text" lang={language}>
            {item.text}
          </p>
        )}
      </article>
      <div className="preview-actions">
        {index > 0 && (
          <button className="secondary" onClick={() => setIndex(index - 1)}>
            上一個
          </button>
        )}
        <button className="primary" onClick={next}>
          {last ? '開始挑戰' : '下一個'}
        </button>
      </div>
    </section>
  );
}
