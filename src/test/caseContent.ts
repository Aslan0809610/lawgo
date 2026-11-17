import type {
  Case,
  CaseBrief,
  Cases,
  Course,
  CourseContent,
  Law,
  TrueFalseQuestion,
} from '../types';

export const caseLaw: Case = {
  no: 'alice',
  label: 'Alice v. CLS Bank',
  title: 'Alice v. CLS Bank',
  year: 2014,
  citation: '573 U.S. 208',
  court: 'Supreme Court',
  sourceUrl: 'https://example.test/alice',
  chapter: 'Cases',
  section: null,
  paragraphs: ['An abstract idea is not enough.'],
  text: 'An abstract idea is not enough.',
};
export const secondCase: Case = {
  ...caseLaw,
  no: 'mayo',
  label: 'Mayo v. Prometheus',
  title: 'Mayo v. Prometheus',
  year: 2012,
  citation: '566 U.S. 66',
  sourceUrl: 'https://example.test/mayo',
  paragraphs: ['Laws of nature are not patentable.'],
  text: 'Laws of nature are not patentable.',
};
export const caseBrief: CaseBrief = {
  nameZh: 'Alice 案',
  facts: '電腦交易的專利爭議。',
  issue: '是否為抽象概念？',
  holding: '僅有抽象概念不足。',
  significance: '建立兩步驟分析。',
  relatedArticles: ['101'],
  keyRule: '應審查是否具有發明概念。',
};
export const cases: Cases = {
  law: 'Cases',
  pcode: 'cases',
  amended: '2024',
  source: '',
  kind: 'cases',
  articles: [caseLaw, secondCase],
};
export const caseQuestion: TrueFalseQuestion = {
  id: 'c01-l1-q01',
  lessonId: 'c01-l1',
  type: 'true_false',
  difficulty: 1,
  tags: ['holding'],
  prompt: '抽象概念可以取得專利？',
  answer: false,
  evidence: [{ case: 'alice', quote: 'An abstract idea is not enough.' }],
  explanation: '判決認為抽象概念不具專利適格性。',
};
export const caseCourse: Course = {
  id: 'test-us',
  title: '測試美國法',
  language: 'en',
  lawFile: 'laws/test/articles.json',
  casesFile: 'cases/test/cases.json',
  units: [
    {
      id: 'c01',
      title: '判例',
      description: '適格性',
      kind: 'cases',
      lessons: [{ id: 'c01-l1', title: '判例入門', articles: [], cases: ['alice', 'mayo'] }],
    },
  ],
};
export const caseStatute: Law = {
  law: 'Statute',
  pcode: 'us',
  amended: '2024',
  source: 'https://example.test/law',
  articles: [
    {
      no: '101',
      label: '§ 101',
      chapter: 'Chapter 10',
      section: null,
      paragraphs: ['Whoever invents a useful process.'],
      text: 'Whoever invents a useful process.',
    },
  ],
};
export const caseContent: CourseContent = {
  course: caseCourse,
  law: caseStatute,
  cases,
  briefs: { alice: caseBrief },
  questions: [caseQuestion],
  demo: false,
};
