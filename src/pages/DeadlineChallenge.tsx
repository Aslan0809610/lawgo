import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DeadlineIntro, DeadlineResult } from '../components/DeadlineSummary';
import { Feedback } from '../components/Feedback';
import { useContent } from '../components/Layout';
import { QuestionRenderer } from '../components/questions';
import { deadlineQuestions } from '../engine';
import { useDeadlineChallenge } from '../hooks/useDeadlineChallenge';
import { progressStore, useProgress } from '../store';

export function DeadlineChallenge() {
  const { course, questions, law } = useContent();
  const progress = useProgress();
  const [pool] = useState(() => deadlineQuestions(questions, progressStore.clock.now().getTime()));
  const challenge = useDeadlineChallenge(course.id, pool);
  const returnTo = `/${course.id}/review`;
  const best = progress.bestScores[course.id] ?? 0;

  if (challenge.started === null) {
    return (
      <DeadlineIntro
        count={pool.length}
        best={best}
        returnTo={returnTo}
        onStart={challenge.start}
      />
    );
  }
  if (challenge.remaining === 0) {
    return (
      <DeadlineResult
        score={challenge.score}
        best={best}
        returnTo={returnTo}
        onRestart={challenge.restart}
      />
    );
  }

  return (
    <div className="lesson-page">
      <div className="session-toolbar">
        <Link className="close" aria-label="離開挑戰" to={returnTo}>
          ×
        </Link>
        <span className={challenge.remaining <= 10 ? 'timer urgent' : 'timer'} role="timer">
          ◷ {challenge.remaining} 秒
        </span>
        <span>答對 {challenge.score} 題</span>
      </div>
      <div className="question-meta">
        <span>期限大挑戰</span>
        <span>第 {challenge.index + 1} 題</span>
      </div>
      <h1 className="question-prompt">{challenge.question.prompt}</h1>
      <QuestionRenderer
        key={challenge.index}
        question={challenge.question}
        onAnswer={challenge.answer}
      />
      {challenge.feedback !== null && (
        <Feedback
          correct={challenge.feedback}
          question={challenge.question}
          law={law}
          onContinue={challenge.nextQuestion}
        />
      )}
    </div>
  );
}
