import { useEffect, useState } from 'react';
import { shuffle } from '../../engine';
import type { MatchQuestion } from '../../types';
import { CheckButton } from './CheckButton';
import type { QuestionProps } from './types';

export function Match({ question, onAnswer }: QuestionProps<MatchQuestion>) {
  const [left] = useState(() =>
    shuffle(
      question.pairs.map((pair, id) => ({ text: pair.left, id })),
      Math.random,
    ),
  );
  const [right] = useState(() =>
    shuffle(
      question.pairs.map((pair, id) => ({ text: pair.right, id })),
      Math.random,
    ),
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState<number[]>([]);
  const [wrong, setWrong] = useState(false);
  const [flash, setFlash] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const complete = done.length === question.pairs.length;

  useEffect(() => {
    if (flash === null) return;
    const timer = setTimeout(() => setFlash(null), 550);
    return () => clearTimeout(timer);
  }, [flash]);

  function selectRight(pairId: number) {
    if (selected === null || submitted || done.includes(pairId)) return;
    if (selected === pairId) {
      setDone((previous) => [...previous, pairId]);
      setSelected(null);
      return;
    }
    setWrong(true);
    setFlash(pairId);
  }

  function submitAnswer() {
    if (!complete || submitted) return;
    setSubmitted(true);
    onAnswer(!wrong);
  }

  function leftClassName(pairId: number) {
    if (selected === pairId) return 'selected';
    return done.includes(pairId) ? 'matched' : '';
  }

  function rightClassName(pairId: number) {
    if (flash === pairId) return 'flash-wrong';
    return done.includes(pairId) ? 'matched' : '';
  }

  return (
    <>
      <p className="hint">先選左欄，再選右欄。配錯後仍請完成全部配對。</p>
      <div className="match-grid">
        <div>
          {left.map((pair) => (
            <button
              key={pair.id}
              disabled={submitted || done.includes(pair.id)}
              className={leftClassName(pair.id)}
              aria-label={`左欄：${pair.text}`}
              aria-pressed={selected === pair.id}
              onClick={() => setSelected(pair.id)}
            >
              {pair.text}
              {done.includes(pair.id) && ' ✓'}
            </button>
          ))}
        </div>
        <div>
          {right.map((pair) => (
            <button
              key={pair.id}
              disabled={submitted || done.includes(pair.id) || selected === null}
              className={rightClassName(pair.id)}
              aria-label={`右欄：${pair.text}`}
              onClick={() => selectRight(pair.id)}
            >
              {pair.text}
              {done.includes(pair.id) && ' ✓'}
            </button>
          ))}
        </div>
      </div>
      <p className="hint" role="status">
        {flash !== null
          ? '配對不正確，再試一次。'
          : `已配對 ${done.length} / ${question.pairs.length}`}
      </p>
      <CheckButton ready={complete} submitted={submitted} submit={submitAnswer} />
    </>
  );
}
