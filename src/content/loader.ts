import type { CaseBriefs, Cases, Course, CourseContent, Law, Question } from '../types';

interface ContentSources {
  courses: Record<string, Course>;
  questionFiles: Record<string, Question[]>;
  laws: Record<string, Law>;
  cases?: Record<string, Cases>;
  briefs?: Record<string, CaseBriefs>;
  fixtures: Question[];
  development: boolean;
}

export function loadCatalog(sources: ContentSources): CourseContent[] {
  return Object.entries(sources.courses).map(([coursePath, course]) => {
    const courseDirectory = coursePath.slice(0, coursePath.lastIndexOf('/'));
    const questionDirectory = `${courseDirectory}/questions/`;
    const files = Object.entries(sources.questionFiles).filter(([filename]) => {
      const basename = filename.split('/').at(-1);
      return filename.startsWith(questionDirectory) && !basename?.startsWith('_');
    });
    const law = sources.laws[`../content/${course.lawFile}`];
    if (!law) throw new Error(`找不到課程條文：${course.lawFile}`);

    // The bundled sample questions belong only to the Taiwan patent course.
    const demo = sources.development && course.id === 'patent' && files.length === 0;
    const questions = demo ? sources.fixtures : files.flatMap(([, contents]) => contents);
    const casesPath = course.casesFile && `../content/${course.casesFile}`;
    const cases = casesPath ? sources.cases?.[casesPath] : undefined;
    if (casesPath && !cases) throw new Error(`找不到課程判例：${course.casesFile}`);
    const briefsPath = casesPath?.replace(/cases\.json$/, 'briefs.json');
    const briefs = briefsPath ? sources.briefs?.[briefsPath] : undefined;
    return { course, law, questions, demo, cases, briefs };
  });
}
