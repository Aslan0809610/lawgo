import { useEffect, useRef } from 'react';
import type { Law, Question } from '../types';
import { EvidenceCards } from './ArticleCard';
export function Feedback({
  correct,
  question,
  law,
  onContinue,
}: {
  correct: boolean;
  question: Question;
  law: Law;
  onContinue(): void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <section
      className={`feedback ${correct ? 'correct' : 'incorrect'}`}
      role="region"
      aria-label="作答回饋"
    >
      <div className="feedback-inner">
        <h2 ref={heading} tabIndex={-1}>
          {correct ? '✓ 答對了，繼續累積！' : '× 再記一次，下次會更好'}
        </h2>
        <p>{question.explanation}</p>
        <EvidenceCards question={question} law={law} />
        <button className="primary" onClick={onContinue}>
          繼續
        </button>
      </div>
    </section>
  );
}
