import type { Course, CourseContent, Law, Question } from '../types';

interface ContentSources {
  courses: Record<string, Course>;
  questionFiles: Record<string, Question[]>;
  laws: Record<string, Law>;
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

    const demo = sources.development && files.length === 0;
    const questions = demo ? sources.fixtures : files.flatMap(([, contents]) => contents);
    return { course, law, questions, demo };
  });
}
