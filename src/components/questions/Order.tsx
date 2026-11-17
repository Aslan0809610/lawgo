import { useState } from 'react';
import { checkAnswer, shuffle } from '../../engine';
import type { OrderQuestion } from '../../types';
import { CheckButton } from './CheckButton';
import type { QuestionProps } from './types';

export function Order({ question, onAnswer }: QuestionProps<OrderQuestion>) {
  const [items] = useState(() => shuffle(question.items, Math.random));
  const [answer, setAnswer] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const complete = answer.length === items.length;

  function appendItem(text: string) {
    setAnswer((previous) => (previous.includes(text) ? previous : [...previous, text]));
  }

  function removeItem(text: string) {
    setAnswer((previous) => previous.filter((item) => item !== text));
  }

  function submitAnswer() {
    if (!complete || submitted) return;
    setSubmitted(true);
    onAnswer(checkAnswer(question, answer));
  }

  return (
    <>
      <p className="hint">依正確順序點選；點選已排的步驟可以取回。</p>
      <div className="answer-row" role="group" aria-label="已排步驟">
        {answer.length === 0 && <p className="hint">從下方選出第一個步驟</p>}
        {answer.map((text, index) => (
          <button key={text} disabled={submitted} onClick={() => removeItem(text)}>
            <b>{index + 1}</b>
            {text}
          </button>
        ))}
      </div>
      <div className="options order-bank">
        {items.map((text) => (
          <button
            key={text}
            disabled={submitted || answer.includes(text)}
            onClick={() => appendItem(text)}
          >
            {text}
          </button>
        ))}
      </div>
      <CheckButton ready={complete} submitted={submitted} submit={submitAnswer} />
    </>
  );
}
