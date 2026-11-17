import { describe, expect, it } from 'vitest';
import fixtures from '../../content/fixtures/sample-questions.json';
import { emptyProgress } from '../store';
import type { Question } from '../types';
import { answerSession, key, rewardSession, startSession } from './index';

const now = new Date(2026, 10, 17);
const questions = [fixtures[0]] as Question[];

describe('session reward transaction', () => {
  it('awards XP, a capped lesson crown and one completed round together', () => {
    const previous = emptyProgress();
    previous.crowns[key('patent', 'u01-l1')] = 3;
    const completed = answerSession(startSession(questions, now), true);
    const next = rewardSession(previous, completed, 'patent', 'u01-l1', now);
    expect(next.totalXp).toBe(15);
    expect(next.crowns[key('patent', 'u01-l1')]).toBe(3);
    expect(next.sessionsCompleted).toBe(1);
    expect(previous.totalXp).toBe(0);
  });

  it('awards practice XP without adding a lesson crown', () => {
    const completed = answerSession(startSession(questions, now), true);
    const next = rewardSession(emptyProgress(), completed, 'patent', undefined, now);
    expect(next.totalXp).toBe(15);
    expect(next.crowns).toEqual({});
  });

  it('never rewards failed, unfinished or empty sessions', () => {
    const previous = emptyProgress();
    const unfinished = startSession(questions, now);
    const failed = { ...unfinished, status: 'failed' as const, hearts: 0 };
    for (const session of [unfinished, failed, startSession([], now)]) {
      expect(rewardSession(previous, session, 'patent', 'u01-l1', now)).toBe(previous);
    }
  });
});
