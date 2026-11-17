import { useState } from 'react';
import { checkAnswer } from '../../engine';
import type { TrueFalseQuestion } from '../../types';
import { CheckButton } from './CheckButton';
import type { QuestionProps } from './types';

export function TrueFalse({ question, onAnswer }: QuestionProps<TrueFalseQuestion>) {
  const [value, setValue] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submitAnswer() {
    if (value === null || submitted) return;
    setSubmitted(true);
    onAnswer(checkAnswer(question, value));
  }

  return (
    <>
      <div className="binary">
        <button
          disabled={submitted}
          aria-pressed={value === true}
          className={value === true ? 'selected' : ''}
          onClick={() => setValue(true)}
        >
          <span>○</span>正確
        </button>
        <button
          disabled={submitted}
          aria-pressed={value === false}
          className={value === false ? 'selected' : ''}
          onClick={() => setValue(false)}
        >
          <span>×</span>錯誤
        </button>
      </div>
      <CheckButton ready={value !== null} submitted={submitted} submit={submitAnswer} />
    </>
  );
}
