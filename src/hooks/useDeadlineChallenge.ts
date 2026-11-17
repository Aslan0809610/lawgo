import { useEffect, useRef, useState } from 'react';
import { deadlineRemaining, key, recordBest, scheduleReview } from '../engine';
import { progressStore } from '../store';
import type { Question } from '../types';

export function useDeadlineChallenge(courseId: string, pool: Question[]) {
  const [started, setStarted] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(60);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const recorded = useRef(false);
  const seen = useRef(new Set<string>());
  const ended = remaining === 0;
  const question = pool[index % pool.length];

  useEffect(() => {
    if (started === null || ended) return;
    function tick() {
      setRemaining(deadlineRemaining(started!, progressStore.clock.now().getTime()));
    }
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [started, ended]);

  useEffect(() => {
    if (started === null || !ended || recorded.current) return;
    recorded.current = true;
    progressStore.update((previous) => recordBest(previous, courseId, score));
  }, [ended, started, score, courseId]);

  function start() {
    if (pool.length > 0) setStarted(progressStore.clock.now().getTime());
  }

  function restart() {
    recorded.current = false;
    seen.current.clear();
    setStarted(null);
    setRemaining(60);
    setIndex(0);
    setScore(0);
    setFeedback(null);
  }

  function answer(correct: boolean) {
    if (started === null || !question || feedback !== null) return;
    const secondsLeft = deadlineRemaining(started, progressStore.clock.now().getTime());
    setRemaining(secondsLeft);
    if (secondsLeft === 0) return;

    setScore((previous) => previous + Number(correct));
    setFeedback(correct);
    if (seen.current.has(question.id)) return;
    seen.current.add(question.id);
    const questionKey = key(courseId, question.id);
    progressStore.update((previous, now) => ({
      ...previous,
      questions: {
        ...previous.questions,
        [questionKey]: scheduleReview(previous.questions[questionKey], correct, now),
      },
    }));
  }

  function nextQuestion() {
    setFeedback(null);
    setIndex((previous) => previous + 1);
  }

  return {
    started,
    remaining,
    index,
    score,
    feedback,
    question,
    start,
    restart,
    answer,
    nextQuestion,
  };
}
