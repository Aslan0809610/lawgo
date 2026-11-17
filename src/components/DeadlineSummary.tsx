import { Link } from 'react-router-dom';
import { StatGrid } from './StatGrid';

interface DeadlineIntroProps {
  count: number;
  best: number;
  returnTo: string;
  onStart(): void;
}

export function DeadlineIntro({ count, best, returnTo, onStart }: DeadlineIntroProps) {
  const stats = [
    { label: '秒倒數', value: 60 },
    { label: '期限題庫', value: count },
    { label: '最佳紀錄', value: best },
  ];

  return (
    <section className="deadline-intro">
      <div className="result-medal">◷</div>
      <div className="eyebrow">期間數字，記牢了嗎？</div>
      <h1>期限大挑戰</h1>
      <p>60 秒內答對越多題越好。每題仍可讀解說與原文，再按繼續。</p>
      <StatGrid stats={stats} />
      <p className="notice">本模式記錄答對題數，不計皇冠與 XP。題目用完後循環出題。</p>
      {count > 0 ? (
        <button className="primary" onClick={onStart}>
          開始挑戰
        </button>
      ) : (
        <p className="notice">期限題庫準備中。</p>
      )}
      <Link className="back-link" to={returnTo}>
        ← 返回複習
      </Link>
    </section>
  );
}

export function DeadlineResult({
  score,
  best,
  returnTo,
  onRestart,
}: {
  score: number;
  best: number;
  returnTo: string;
  onRestart(): void;
}) {
  return (
    <section className="result-page">
      <div className="result-medal">✦</div>
      <h1>時間到，挑戰完成！</h1>
      <StatGrid
        stats={[
          { label: '本次答對', value: score },
          { label: '最佳紀錄', value: Math.max(score, best) },
        ]}
      />
      <button className="primary" onClick={onRestart}>
        再挑戰一次
      </button>
      <Link className="secondary" to={returnTo}>
        返回複習
      </Link>
    </section>
  );
}
