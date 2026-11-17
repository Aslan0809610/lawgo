import { useState } from 'react';
import { checkAnswer, shuffle } from '../../engine';
import type { ClozeQuestion } from '../../types';
import { CheckButton } from './CheckButton';
import type { QuestionProps } from './types';

export function Cloze({ question, onAnswer }: QuestionProps<ClozeQuestion>) {
  const [chips] = useState(() => {
    const words = [...question.blanks, ...question.distractors];
    return shuffle(
      words.map((text, id) => ({ text, id })),
      Math.random,
    );
  });
  const [filled, setFilled] = useState<(number | null)[]>(() => question.blanks.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const parts = question.text.split(/(\{\{\d+\}\})/g);
  const complete = !filled.includes(null);

  function fillNextBlank(chipId: number) {
    setFilled((previous) => {
      const nextEmpty = previous.indexOf(null);
      if (nextEmpty < 0 || previous.includes(chipId)) return previous;
      return previous.map((value, index) => (index === nextEmpty ? chipId : value));
    });
  }

  function clearBlank(blankIndex: number) {
    setFilled((previous) => previous.map((value, index) => (index === blankIndex ? null : value)));
  }

  function submitAnswer() {
    if (!complete || submitted) return;
    const answer = filled.map((id) => chips.find((chip) => chip.id === id)!.text);
    setSubmitted(true);
    onAnswer(checkAnswer(question, answer));
  }

  function renderSentencePart(part: string, partIndex: number) {
    const placeholder = part.match(/^\{\{(\d+)\}\}$/);
    if (!placeholder) return <span key={partIndex}>{part}</span>;

    const blankIndex = Number(placeholder[1]);
    const chip = chips.find((item) => item.id === filled[blankIndex]);
    const label = `空格 ${blankIndex + 1}：${chip?.text ?? '未填'}`;

    return (
      <button
        key={partIndex}
        disabled={submitted}
        className="blank"
        aria-label={label}
        onClick={() => clearBlank(blankIndex)}
      >
        {chip?.text ?? '　　'}
      </button>
    );
  }

  return (
    <>
      <p className="cloze-sentence">{parts.map(renderSentencePart)}</p>
      <div className="word-bank" role="group" aria-label="字詞庫">
        {chips.map((chip) => (
          <button
            key={chip.id}
            disabled={submitted || filled.includes(chip.id) || complete}
            onClick={() => fillNextBlank(chip.id)}
          >
            {chip.text}
          </button>
        ))}
      </div>
      <CheckButton ready={complete} submitted={submitted} submit={submitAnswer} />
    </>
  );
}
