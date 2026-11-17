import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  answerSession,
  buildSession,
  key,
  rewardSession,
  scheduleReview,
  sessionXp,
  startSession,
} from '../engine';
import { progressStore } from '../store';
import type { PracticeConfig, Session, SessionResult } from '../types';

interface PendingFeedback {
  correct: boolean;
  next: Session;
}

export function useLessonSession(config: PracticeConfig, retryTo: string) {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    const now = progressStore.clock.now();
    const questions = buildSession(
      config.pool,
      progressStore.getSnapshot(),
      config.courseId,
      config.crown,
      now.getTime(),
      config.mode === 'unit' ? 15 : 10,
      config.mode !== 'lesson',
    );
    return startSession(questions, now);
  });
  const [feedback, setFeedback] = useState<PendingFeedback | null>(null);
  const question = session.queue[0];

  function answer(correct: boolean) {
    if (feedback || !question) return;
    const next = answerSession(session, correct);
    if (!(question.id in session.firstAnswers)) {
      const questionKey = key(config.courseId, question.id);
      progressStore.update((previous, now) => ({
        ...previous,
        questions: {
          ...previous.questions,
          [questionKey]: scheduleReview(previous.questions[questionKey], correct, now),
        },
      }));
    }
    setFeedback({ correct, next });
  }

  function finish(next: Session) {
    const lessonId = config.mode === 'lesson' ? config.lessonId : undefined;
    progressStore.update((previous, now) =>
      rewardSession(previous, next, config.courseId, lessonId, now),
    );
    const elapsed = progressStore.clock.now().getTime() - next.startedAt;
    const result: SessionResult = {
      success: next.status === 'complete',
      xp: sessionXp(next),
      accuracy: Math.round((next.correct / next.attempts) * 100),
      seconds: Math.max(0, Math.round(elapsed / 1000)),
      title: config.title,
      returnTo: config.returnTo,
      retryTo,
    };
    navigate(`/${config.courseId}/result`, { replace: true, state: result });
  }

  function continueSession() {
    if (!feedback) return;
    if (feedback.next.status !== 'active') {
      finish(feedback.next);
      return;
    }
    setSession(feedback.next);
    setFeedback(null);
  }

  return { session, feedback, question, answer, continueSession };
}
