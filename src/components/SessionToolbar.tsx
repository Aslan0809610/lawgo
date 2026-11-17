import { Link } from 'react-router-dom';

interface SessionToolbarProps {
  returnTo: string;
  solved: number;
  total: number;
  hearts: number;
}

export function SessionToolbar({ returnTo, solved, total, hearts }: SessionToolbarProps) {
  return (
    <div className="session-toolbar">
      <Link to={returnTo} className="close" aria-label="離開練習">
        ×
      </Link>
      <div
        className="session-progress"
        role="progressbar"
        aria-label="回合進度"
        aria-valuenow={solved}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <span style={{ width: `${total > 0 ? (solved / total) * 100 : 0}%` }} />
      </div>
      <span className="hearts" aria-label={`剩餘 ${hearts} 顆愛心`}>
        ♥ {hearts}
      </span>
    </div>
  );
}
