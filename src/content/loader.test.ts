import { describe, expect, it } from 'vitest';
import courseJson from '../../content/courses/patent/course.json';
import law from '../../content/laws/patent/articles.json';
import fixtures from '../../content/fixtures/sample-questions.json';
import type { Course, Question } from '../types';
import { loadCatalog } from './loader';

// Keep loader fixtures independent of concurrently authored case units.
const course: Course = {
  ...courseJson,
  language: 'zh',
  casesFile: undefined,
  units: (courseJson as Course).units.filter(
    (unit) => !unit.lessons.some((lesson) => lesson.cases),
  ),
};

const sources = {
  courses: { '../content/courses/patent/course.json': course },
  laws: { '../content/laws/patent/articles.json': law },
  fixtures: fixtures as Question[],
  development: true,
};

describe('course discovery', () => {
  it.each(Array.from({ length: 11 }, (_, count) => count))(
    'loads safely with %i question files, falling back only at zero in development',
    (count) => {
      const questionFiles = Object.fromEntries(
        Array.from({ length: count }, (_, index) => [
          `../content/courses/patent/questions/u${String(index + 1).padStart(2, '0')}.json`,
          [fixtures[index % fixtures.length] as Question],
        ]),
      );
      const [content] = loadCatalog({ ...sources, questionFiles });
      expect(content.demo).toBe(count === 0);
      expect(content.questions).toHaveLength(count === 0 ? fixtures.length : count);
      expect(content.law).toBe(law);
    },
  );

  it('ignores drafts and never uses fixture questions in a production build', () => {
    const questionFiles = {
      '../content/courses/patent/questions/_draft.json': [fixtures[0] as Question],
    };
    expect(loadCatalog({ ...sources, questionFiles })[0].demo).toBe(true);
    const [production] = loadCatalog({ ...sources, questionFiles, development: false });
    expect(production.questions).toEqual([]);
    expect(production.demo).toBe(false);
  });

  it('discovers multiple courses by their paths with independent law references', () => {
    const extra = { ...course, id: 'second', lawFile: 'laws/second/official.json' };
    const content = loadCatalog({
      ...sources,
      courses: { ...sources.courses, '../content/courses/another-folder/course.json': extra },
      laws: { ...sources.laws, '../content/laws/second/official.json': law },
      questionFiles: {
        '../content/courses/another-folder/questions/u01.json': [fixtures[0] as Question],
      },
    });
    expect(content.map((item) => item.course.id)).toEqual(['patent', 'second']);
    expect(content[1].questions).toHaveLength(1);
    expect(content[1].demo).toBe(false);
  });

  it('reports a missing law file with its course reference', () => {
    expect(() => loadCatalog({ ...sources, laws: {}, questionFiles: {} })).toThrow(course.lawFile);
  });
});

it('keeps a second empty course empty in development rather than reusing Taiwan fixtures', () => {
  const extra = { ...course, id: 'us-patent' };
  const [content] = loadCatalog({
    ...sources,
    courses: { '../content/courses/us-patent/course.json': extra },
    questionFiles: {},
  });
  expect(content.questions).toEqual([]);
  expect(content.demo).toBe(false);
});

it('loads case corpora and optional briefs by the course reference', async () => {
  const { caseContent } = await import('../test/caseContent');
  const caseSources = {
    ...sources,
    courses: { '../content/courses/test/course.json': caseContent.course },
    laws: { '../content/laws/test/articles.json': caseContent.law },
    cases: { '../content/cases/test/cases.json': caseContent.cases! },
    questionFiles: {},
  };
  const [missingBriefs] = loadCatalog(caseSources);
  expect(missingBriefs.cases).toBe(caseContent.cases);
  expect(missingBriefs.briefs).toBeUndefined();
  const [withBriefs] = loadCatalog({
    ...caseSources,
    briefs: { '../content/cases/test/briefs.json': caseContent.briefs! },
  });
  expect(withBriefs.briefs).toBe(caseContent.briefs);
  expect(withBriefs.questions).toEqual([]);
  expect(() => loadCatalog({ ...caseSources, cases: {} })).toThrow(caseContent.course.casesFile);
});
