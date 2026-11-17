import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { courseTargets, validateQuestions } from './validate-content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const text = 'An abstract idea is not enough.';
const law = { articles: [{ no: '101', text: 'Whoever invents a useful process.' }] };
const cases = {
  kind: 'cases',
  articles: [
    {
      no: 'alice',
      label: 'Alice',
      title: 'Alice',
      year: 2014,
      citation: '573 U.S. 208',
      court: 'Supreme Court',
      sourceUrl: 'https://example.test',
      paragraphs: [text],
      text,
    },
  ],
};
const course = {
  id: 'test',
  casesFile: 'cases/test/cases.json',
  units: [
    { id: 'cases', lessons: [{ id: 'cases-l1', title: 'Alice', articles: [], cases: ['alice'] }] },
  ],
};
const briefs = {
  alice: {
    nameZh: 'Alice 案',
    facts: '事實',
    issue: '爭點',
    holding: '判決',
    significance: '意義',
    keyRule: '規則',
    relatedArticles: ['101'],
  },
};
const question = {
  id: 'cases-l1-q01',
  lessonId: 'cases-l1',
  type: 'true_false',
  difficulty: 1,
  tags: ['holding'],
  prompt: '抽象概念可以取得專利？',
  answer: false,
  explanation: '不可以。',
  evidence: [{ case: 'alice', quote: text }],
};
const validate = (questions, extra = {}) =>
  validateQuestions(questions, course, law, { cases, briefs, coverage: false, ...extra });

describe('case validation rules 7–10', () => {
  it('accepts case evidence, mixed sources and English cloze with whitespace differences', () => {
    const cloze = {
      ...question,
      type: 'cloze',
      text: 'An {{0}} idea\nis not enough.',
      blanks: ['abstract'],
      distractors: ['concrete', 'new'],
      evidence: [
        { case: 'alice', quote: 'An abstract\nidea is not enough.' },
        { article: '101', quote: 'a useful process.' },
      ],
    };
    expect(validate([question]).errors).toEqual([]);
    expect(validate([cloze]).errors).toEqual([]);
  });

  it.each([
    [{ article: '101', case: 'alice', quote: text }, '剛好有 article 或 case'],
    [{ quote: text }, '剛好有 article 或 case'],
    [{ case: 'missing', quote: text }, '不存在的判例 missing'],
    [{ case: 'alice', quote: 'Invented text' }, '找不到 evidence.quote'],
    [{ case: '', quote: text }, '非空字串'],
    [{ case: 'alice', quote: '' }, '非空字串'],
  ])('rejects invalid evidence %j', (evidence, message) => {
    expect(validate([{ ...question, evidence: [evidence] }]).errors.join()).toContain(message);
  });

  it('requires case evidence on every case-lesson question and checks case ownership', () => {
    const statuteOnly = { ...question, evidence: [{ article: '101', quote: 'a useful process.' }] };
    expect(validate([statuteOnly]).errors.join()).toContain('至少需要一筆 case');
    const missing = validate([question], { cases: undefined });
    expect(missing.errors.join()).toContain('找不到 casesFile');
    expect(missing.errors.join()).toContain('不存在的判例 alice');
    const cloze = {
      ...question,
      type: 'cloze',
      text: 'Invented {{0}}',
      blanks: ['text'],
      distractors: ['old', 'new'],
    };
    expect(validate([cloze]).errors.join()).toContain('連續片段');
  });

  it('checks every brief and its related articles only when a briefs file exists', () => {
    expect(validate([question], { briefs: undefined }).errors).toEqual([]);
    expect(validate([question], { briefs: {} }).errors.join()).toContain('缺少完整摘要');
    expect(
      validate([question], {
        briefs: { alice: { ...briefs.alice, relatedArticles: ['999'] } },
      }).errors.join(),
    ).toContain('relatedArticles 條文 999 不存在');
    const invalidCourse = {
      ...course,
      units: [
        { lessons: [{ id: 'cases-l1', title: 'Bad', articles: ['999'], cases: ['missing'] }] },
      ],
    };
    expect(
      validateQuestions([question], invalidCourse, law, { cases, coverage: false }).errors.join(),
    ).toContain('判例 missing 不存在於 casesFile');
  });

  it('requires eight questions and three types for case lessons in full mode', () => {
    const questions = Array.from({ length: 8 }, (_, index) => ({
      ...question,
      id: `cases-l1-q${String(index + 1).padStart(2, '0')}`,
    }));
    questions[1] = {
      ...questions[1],
      type: 'single_choice',
      options: ['甲', '乙', '丙', '丁'],
      answerIndex: 0,
    };
    questions[2] = {
      ...questions[2],
      type: 'cloze',
      text: 'An {{0}} idea is not enough.',
      blanks: ['abstract'],
      distractors: ['concrete', 'new'],
    };
    expect(validate(questions, { coverage: true }).errors).toEqual([]);
    expect(validate([], { coverage: true }).errors).toHaveLength(2);
  });
});

describe('single-file course ownership', () => {
  const targets = ['patent', 'us-patent'].map((id) => ({
    dir: path.join(root, 'content/courses', id),
    course: JSON.parse(
      fs.readFileSync(path.join(root, 'content/courses', id, 'course.json'), 'utf8'),
    ),
  }));

  it('uses the containing course directory for shared lesson ids, for either course', () => {
    for (const target of targets) {
      expect(
        courseTargets(targets, path.join(target.dir, 'questions/u01.json'), [
          { lessonId: 'u01-l1' },
        ]),
      ).toEqual([target]);
    }
  });
  it('infers ownership of external drafts from lessons, then evidence if lesson ids overlap', () => {
    const taiwanLessons = new Set(
      targets[0].course.units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)),
    );
    const uniqueLesson = targets[1].course.units
      .flatMap((unit) => unit.lessons)
      .find((lesson) => !taiwanLessons.has(lesson.id));
    expect(
      courseTargets(targets, path.join(root, 'draft.json'), [{ lessonId: uniqueLesson.id }]),
    ).toEqual([targets[1]]);
    const taiwan = JSON.parse(
      fs.readFileSync(path.join(root, 'content/fixtures/sample-questions.json'), 'utf8'),
    );
    expect(courseTargets(targets, path.join(root, 'draft.json'), taiwan, root)).toEqual([
      targets[0],
    ]);
    const corpus = JSON.parse(
      fs.readFileSync(path.join(root, 'content/cases/us-patent/cases.json'), 'utf8'),
    );
    const item = corpus.articles[0];
    expect(
      courseTargets(
        targets,
        path.join(root, 'draft.json'),
        [{ lessonId: 'u09-l1', evidence: [{ case: item.no, quote: item.text.slice(0, 100) }] }],
        root,
      ),
    ).toEqual([targets[1]]);
    expect(() =>
      courseTargets(targets, path.join(root, 'draft.json'), [{ lessonId: 'u01-l1' }], root),
    ).toThrow();
  });
});
