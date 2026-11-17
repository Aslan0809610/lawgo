import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fixtures from '../../content/fixtures/sample-questions.json';
import { key } from '../engine';
import { progressStore } from '../store';
import type { Question } from '../types';
import { useDeadlineChallenge } from './useDeadlineChallenge';

const pool = [fixtures[0]] as Question[];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 17, 12));
  progressStore.reset();
});
afterEach(() => vi.useRealTimers());

describe('deadline round controller', () => {
  it('expires while feedback is open and saves the best score only once', () => {
    const { result } = renderHook(() => useDeadlineChallenge('patent', pool));
    act(() => result.current.start());
    act(() => result.current.answer(true));
    expect(result.current.feedback).toBe(true);
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.remaining).toBe(0);
    expect(progressStore.getSnapshot().bestScores.patent).toBe(1);
    act(() => result.current.answer(true));
    expect(result.current.score).toBe(1);
    expect(progressStore.getSnapshot().totalXp).toBe(0);
  });

  it('cycles a short pool without promoting repeated answers and supports a fresh attempt', () => {
    const { result } = renderHook(() => useDeadlineChallenge('patent', pool));
    act(() => result.current.start());
    act(() => result.current.answer(false));
    act(() => result.current.nextQuestion());
    expect(result.current.question).toBe(pool[0]);
    act(() => result.current.answer(true));
    const saved = progressStore.getSnapshot().questions[key('patent', pool[0].id)];
    expect(saved.box).toBe(1);
    expect(saved.attempts).toBe(1);
    act(() => vi.advanceTimersByTime(60_000));
    act(() => result.current.restart());
    expect(result.current.started).toBeNull();
    expect(result.current.remaining).toBe(60);
    expect(result.current.score).toBe(0);
    act(() => result.current.start());
    act(() => result.current.answer(true));
    expect(progressStore.getSnapshot().questions[key('patent', pool[0].id)].box).toBe(2);
  });

  it('does not start an empty pool or accept answers before starting', () => {
    const { result } = renderHook(() => useDeadlineChallenge('patent', []));
    act(() => result.current.start());
    act(() => result.current.answer(true));
    expect(result.current.started).toBeNull();
    expect(result.current.score).toBe(0);
    expect(progressStore.getSnapshot().questions).toEqual({});
  });
});
