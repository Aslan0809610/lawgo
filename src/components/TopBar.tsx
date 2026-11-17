import { NavLink } from 'react-router-dom';
import { localDate, streak } from '../engine';
import type { Progress } from '../types';

interface TopBarProps {
  base: string;
  progress: Progress;
  now: Date;
}

function DailyGoalRing({ today, goal }: { today: number; goal: number }) {
  const degrees = Math.min(1, today / goal) * 360;
  const background = `conic-gradient(var(--gold) ${degrees}deg, var(--line) 0deg)`;

  return (
    <span
      className="goal-ring"
      role="progressbar"
      aria-label="今日目標"
      aria-valuenow={Math.min(today, goal)}
      aria-valuemin={0}
      aria-valuemax={goal}
      style={{ background }}
    >
      <span>
        {today}
        <small>/{goal}</small>
      </span>
    </span>
  );
}

export function TopBar({ base, progress, now }: TopBarProps) {
  const today = progress.dailyXp[localDate(now)] ?? 0;

  return (
    <header className="topbar">
      <NavLink to={`${base}/path`} className="brand" aria-label="法條通首頁">
        <span className="brand-icon">⚒</span>
        <span>
          法條通<small>LAWGO</small>
        </span>
      </NavLink>
      <div className="top-stats">
        <span title="連勝天數">
          🔥 {streak(progress, now)}
          <small>天</small>
        </span>
        <span title="總經驗值">
          ✦ {progress.totalXp}
          <small>XP</small>
        </span>
        <DailyGoalRing today={today} goal={progress.dailyGoal} />
      </div>
    </header>
  );
}
