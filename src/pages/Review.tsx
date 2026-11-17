import { Link } from 'react-router-dom';
import { EvidenceCards } from '../components/ArticleCard';
import { useContent } from '../components/Layout';
import { dueReviews, key } from '../engine';
import { progressStore, useProgress } from '../store';
import type { Question } from '../types';
export function Review() {
  const { course, law, questions } = useContent();
  const progress = useProgress();
  const base = `/${course.id}`;
  const due = dueReviews(questions, course, progress, progressStore.clock.now());
  const wrong = questions.filter((q) => progress.questions[key(course.id, q.id)]?.box === 1);
  const deadline = questions.filter((q) => q.tags.includes('deadline')).length;
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">讓記憶，慢慢長成實力</div>
        <h1>溫故知新</h1>
        <p>依記憶節奏複習，把容易忘的再記牢。</p>
      </div>
      <section className="review-card">
        <span className="card-icon">↻</span>
        <div>
          <h2>今日到期複習</h2>
          <p>
            {due.length
              ? `${due.length} 題正在等你，花幾分鐘鞏固記憶。`
              : '目前沒有到期題目，完成課程後會自動安排。'}
          </p>
        </div>
        {due.length > 0 ? (
          <Link className="primary" to={`${base}/practice/due`}>
            開始複習 · {due.length} 題
          </Link>
        ) : (
          <Link className="secondary" to={`${base}/path`}>
            繼續學習
          </Link>
        )}
      </section>
      <Link className="deadline-card" to={`${base}/deadline`}>
        <span>◷</span>
        <div>
          <small>60 秒 · 和自己比快</small>
          <h2>期限大挑戰</h2>
          <p>
            {deadline} 題期間重點 · 最佳紀錄 {progress.bestScores[course.id] ?? 0} 題
          </p>
        </div>
        <b>→</b>
      </Link>
      <div className="section-heading">
        <h2>
          錯題本 <small>{wrong.length}</small>
        </h2>
        {wrong.length > 0 && <Link to={`${base}/practice/wrong`}>練習錯題 →</Link>}
      </div>
      <p className="muted-text">盒子 1 的題目都在這裡；再答對一次，就向熟練靠近。</p>
      {wrong.length === 0 ? (
        <div className="empty compact">
          <span>✧</span>
          <p>還沒有錯題。去學習之路試試吧。</p>
        </div>
      ) : (
        wrong.map((q) => (
          <details className="wrong-question" key={q.id}>
            <summary>{questionTitle(q)}</summary>
            <p>{q.explanation}</p>
            <EvidenceCards question={q} law={law} />
          </details>
        ))
      )}
      <p className="page-footnote">複習間隔：1、2、4、7、15 天 · 只複習已解鎖的課</p>
    </>
  );
}

function questionTitle(question: Question): string {
  if (question.type !== 'cloze') return question.prompt;
  return question.text.replace(/\{\{\d+\}\}/g, '＿＿');
}
