import { describe, expect, it } from 'vitest';
import course from '../../content/courses/patent/course.json';
import law from '../../content/laws/patent/articles.json';
import fixtures from '../../content/fixtures/sample-questions.json';
import type { Question } from '../types';
import { loadCatalog } from './loader';

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
