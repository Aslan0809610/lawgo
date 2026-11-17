import { Link, useLocation } from 'react-router-dom';
import { useContent } from '../components/Layout';
import { StatGrid } from '../components/StatGrid';
import type { SessionResult } from '../types';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
}

function resultMessage(result: SessionResult): string {
  if (!result.success) return '這次不增加 XP 與皇冠。錯題已留下，隨時可以再練習。';
  if (result.xp === 15) return '全對獎勵 +5 XP 已入袋！';
  return '答錯的題目已安排複習，記憶會越來越牢。';
}

export function Result() {
  const { course } = useContent();
  const location = useLocation();
  const result = location.state as SessionResult | null;

  if (!result) {
    return (
      <section className="empty">
        <h1>下一次練習，從這裡開始</h1>
        <Link className="primary" to={`/${course.id}/path`}>
          回到學習
        </Link>
      </section>
    );
  }

  const stats = [
    { label: '經驗值 XP', value: `+${result.xp}` },
    { label: '作答正確率', value: `${result.accuracy}%` },
    { label: '練習時間', value: formatDuration(result.seconds) },
  ];

  return (
    <section className="result-page">
      <div className={`result-medal ${result.success ? '' : 'muted'}`}>
        {result.success ? '♛' : '♡'}
      </div>
      <div className="eyebrow">{result.success ? '又向前邁進了一步' : '休息一下，再次出發'}</div>
      <h1>{result.success ? '練習完成！' : '愛心用完了'}</h1>
      <p>{result.title}</p>
      <StatGrid stats={stats} />
      <p className="notice">{resultMessage(result)}</p>
      {!result.success && (
        <Link className="primary" to={result.retryTo}>
          再試一次
        </Link>
      )}
      <Link className={result.success ? 'primary' : 'secondary'} to={result.returnTo}>
        {result.success ? '繼續我的旅程' : '返回'}
      </Link>
    </section>
  );
}
