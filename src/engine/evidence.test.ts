import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../store';
import { caseQuestion } from '../test/caseContent';
import { articleMastery, caseMastery, key, questionsForEvidence, scheduleReview } from './index';

const now = new Date(2026, 10, 17);

describe('case evidence and mastery', () => {
  it('separates articles and cases even when their identifiers coincide', () => {
    const mixed = {
      ...caseQuestion,
      evidence: [
        ...caseQuestion.evidence,
        { article: 'alice', quote: 'Article text' },
        ...caseQuestion.evidence,
      ],
    };
    expect(questionsForEvidence('case', 'alice', [mixed])).toEqual([mixed]);
    expect(questionsForEvidence('article', 'alice', [caseQuestion])).toEqual([]);
    expect(questionsForEvidence('article', 'alice', [mixed])).toEqual([mixed]);
  });

  it('averages all related question boxes, including unpracticed questions, by course', () => {
    const progress = emptyProgress();
    const questions = [caseQuestion, { ...caseQuestion, id: 'c01-l1-q02' }];
    progress.questions[key('us', caseQuestion.id)] = {
      ...scheduleReview(undefined, true, now),
      box: 4,
    };
    expect(caseMastery('alice', questions, progress, 'us')).toEqual({
      average: 2,
      label: '學習中',
    });
    expect(caseMastery('alice', questions, progress, 'patent')).toEqual({
      average: 0,
      label: '未練',
    });
    expect(articleMastery('alice', questions, progress, 'us').label).toBe('未練');
    expect(caseMastery('missing', questions, progress, 'us').label).toBe('未練');
    expect(caseMastery('alice', [caseQuestion], progress, 'us').label).toBe('熟練');
  });
});
