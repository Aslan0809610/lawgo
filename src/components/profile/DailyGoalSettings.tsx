import { localDate, setGoal } from '../../engine';
import { progressStore } from '../../store';
import type { Progress } from '../../types';

const goals: Progress['dailyGoal'][] = [10, 20, 30, 50];

export function DailyGoalSettings({ progress }: { progress: Progress }) {
  const today = localDate(progressStore.clock.now());

  function changeGoal(goal: Progress['dailyGoal']) {
    progressStore.update((previous, now) => setGoal(previous, goal, now));
  }

  return (
    <section className="settings-card">
      <h2>每日目標</h2>
      <p>今日已累積 {progress.dailyXp[today] ?? 0} XP，達標就算連勝一天。</p>
      <div className="goal-options">
        {goals.map((goal) => (
          <button
            key={goal}
            className={progress.dailyGoal === goal ? 'selected' : ''}
            aria-pressed={progress.dailyGoal === goal}
            onClick={() => changeGoal(goal)}
          >
            {goal}
            <small>XP</small>
          </button>
        ))}
      </div>
    </section>
  );
}
