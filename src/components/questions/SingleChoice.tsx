import { useState } from 'react';
import { checkAnswer, shuffle } from '../../engine';
import type { SingleChoiceQuestion } from '../../types';
import { CheckButton } from './CheckButton';
import type { QuestionProps } from './types';

export function SingleChoice({ question, onAnswer }: QuestionProps<SingleChoiceQuestion>) {
  const [options] = useState(() => {
    const indexedOptions = question.options.map((text, index) => ({ text, index }));
    return shuffle(indexedOptions, Math.random);
  });
  const [value, setValue] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function submitAnswer() {
    if (value === null || submitted) return;
    setSubmitted(true);
    onAnswer(checkAnswer(question, value));
  }

  return (
    <>
      <div className="options">
        {options.map((option, displayIndex) => (
          <button
            key={option.index}
            disabled={submitted}
            className={value === option.index ? 'selected' : ''}
            aria-pressed={value === option.index}
            onClick={() => setValue(option.index)}
          >
            <span className="option-letter">{String.fromCharCode(65 + displayIndex)}</span>
            {option.text}
          </button>
        ))}
      </div>
      <CheckButton ready={value !== null} submitted={submitted} submit={submitAnswer} />
    </>
  );
}
