import { useContent } from '../components/Layout';
import { StatGrid } from '../components/StatGrid';
import { BackupControls } from '../components/profile/BackupControls';
import { DailyGoalSettings } from '../components/profile/DailyGoalSettings';
import { ResetProgress } from '../components/profile/ResetProgress';
import { key, streak } from '../engine';
import { progressStore, useProgress } from '../store';

export function Profile() {
  const { course } = useContent();
  const progress = useProgress();
  const now = progressStore.clock.now();
  const totalCrowns = course.units
    .flatMap((unit) => unit.lessons)
    .reduce((sum, lesson) => sum + (progress.crowns[key(course.id, lesson.id)] ?? 0), 0);
  const stats = [
    { label: '累積 XP', value: progress.totalXp },
    { label: '連勝天數', value: streak(progress, now) },
    { label: '本課皇冠', value: totalCrowns },
    { label: '完成回合', value: progress.sessionsCompleted },
  ];

  return (
    <>
      <div className="page-heading">
        <div className="profile-avatar">⚖</div>
        <h1>我的學習手札</h1>
        <p>每天一點，把努力留在這裡。</p>
      </div>
      <StatGrid className="profile-stats" stats={stats} />
      <DailyGoalSettings progress={progress} />
      <BackupControls />
      <ResetProgress />
      <p className="page-footnote">
        法條通 LawGo · 離線也能學習
        <br />
        依隨附版本條文練習，修法時請核對官方來源。
      </p>
    </>
  );
}
