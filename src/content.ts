import fixtures from '../content/fixtures/sample-questions.json';
import { loadCatalog } from './content/loader';
import type { Course, Law, Question } from './types';

const courses = import.meta.glob<Course>('../content/courses/*/course.json', {
  eager: true,
  import: 'default',
});
const questionFiles = import.meta.glob<Question[]>(
  ['../content/courses/*/questions/*.json', '!../content/courses/*/questions/_*.json'],
  { eager: true, import: 'default' },
);
const laws = import.meta.glob<Law>('../content/laws/**/*.json', {
  eager: true,
  import: 'default',
});

export const catalog = loadCatalog({
  courses,
  questionFiles,
  laws,
  fixtures: fixtures as Question[],
  development: import.meta.env.DEV,
});
