import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateQuestions } from './validate-content.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (filename) => JSON.parse(fs.readFileSync(path.resolve(root, filename), 'utf8'));
const questions = read('content/fixtures/sample-questions.json');
const course = read('content/courses/patent/course.json');
const law = read('content/laws/patent/articles.json');
const validate = (q) => validateQuestions(q, course, law, { coverage: false });
describe('content validator', () => {
  it('accepts all five unmodified sample questions in single-file mode', () => {
    expect(validate(questions).errors).toEqual([]);
    expect(validate(questions).summary).toHaveLength(4);
  });
  it('ignores whitespace in evidence and filled cloze', () => {
    const q = structuredClone(questions[2]);
    q.text = `\n ${q.text.replace('，', '，\n ')}`;
    q.evidence[0].quote = q.evidence[0].quote.replace('，', '，\n ');
    expect(validate([q]).errors).toEqual([]);
  });
  it('reports a bad fixture per question, including invented evidence and duplicates', () => {
    const bad = structuredClone(questions[1]);
    bad.id = 'bad-id';
    bad.lessonId = 'missing';
    bad.difficulty = 4;
    bad.tags = ['invented'];
    bad.options = ['同', '同'];
    bad.answerIndex = 5;
    bad.evidence[0].quote = '這不是條文';
    bad.prompt = null;
    bad.explanation = '';
    const result = validate([bad, bad]);
    expect(result.errors.join('\n')).toMatch(/bad-id.*id 格式/);
    expect(result.errors.join('\n')).toContain('id 重複');
    expect(result.errors.join('\n')).toContain('lessonId 不存在');
    expect(result.errors.join('\n')).toContain('找不到 evidence.quote');
    expect(result.errors.length).toBeGreaterThan(10);
  });
  it.each([null, {}, [null], [{ id: 123, evidence: [null] }]])(
    'handles malformed JSON structures without crashing: %j',
    (value) => {
      expect(validate(value).errors.length).toBeGreaterThan(0);
    },
  );
  it('rejects wrong cloze indices, repeated distractors and text outside cited articles', () => {
    const bad = structuredClone(questions[2]);
    bad.text = '不存在{{0}}{{0}}';
    bad.distractors = ['申請日'];
    const errors = validate([bad]).errors.join('\n');
    expect(errors).toContain('{{n}}');
    expect(errors).toContain('2–4');
    expect(errors).toContain('不得與 blanks 重複');
    expect(errors).toContain('連續片段');
  });
  it('rejects nonboolean answers, invalid match sizes/duplicates/length, order sizes/duplicates', () => {
    const tf = { ...questions[0], answer: 'false' };
    expect(validate([tf]).errors.join()).toContain('布林');
    for (const pairs of [
      [],
      Array(4).fill({ left: '重複', right: '相同' }),
      Array(4).fill({ left: '字'.repeat(17), right: '長' }),
    ])
      expect(validate([{ ...questions[3], pairs }]).errors.length).toBeGreaterThan(0);
    for (const items of [[], ['甲', '甲', '乙'], ['甲', '乙', '丙', '丁', '戊', '己']])
      expect(validate([{ ...questions[4], items }]).errors.join()).toContain('3–5');
  });
  it('enforces every lesson’s eight questions and three types in full-course mode', () => {
    const result = validateQuestions([], course, law);
    expect(result.errors).toHaveLength(course.units.flatMap((u) => u.lessons).length * 2);
    expect(result.summary).toHaveLength(29);
  });
});
