export interface Article {
  no: string;
  label: string;
  chapter: string;
  section: string | null;
  paragraphs: string[];
  text: string;
}
export interface Law {
  law: string;
  pcode: string;
  amended: string;
  source: string;
  articles: Article[];
}
export interface Case extends Article {
  title: string;
  year: number;
  citation: string;
  court: string;
  sourceUrl: string;
}
export interface Cases extends Omit<Law, 'articles'> {
  kind: 'cases';
  articles: Case[];
}
export interface CaseBrief {
  nameZh: string;
  facts: string;
  issue: string;
  holding: string;
  significance: string;
  relatedArticles: string[];
  keyRule: string;
}
export type CaseBriefs = Record<string, CaseBrief>;
export interface Lesson {
  id: string;
  title: string;
  articles: string[];
  cases?: string[];
}
export interface Unit {
  kind?: 'cases';
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}
export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  lawFile: string;
  language?: 'zh' | 'en';
  casesFile?: string;
  units: Unit[];
}
export type Tag = 'deadline' | 'definition' | 'procedure' | 'comparison' | 'case' | 'holding';
export type Evidence = { quote: string } & (
  { article: string; case?: never } | { case: string; article?: never }
);
interface BaseQuestion {
  id: string;
  lessonId: string;
  difficulty: 1 | 2 | 3;
  tags: Tag[];
  prompt: string;
  evidence: Evidence[];
  explanation: string;
}
export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  answer: boolean;
}
export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single_choice';
  options: string[];
  answerIndex: number;
}
export interface ClozeQuestion extends BaseQuestion {
  type: 'cloze';
  text: string;
  blanks: string[];
  distractors: string[];
}
export interface MatchQuestion extends BaseQuestion {
  type: 'match';
  pairs: { left: string; right: string }[];
}
export interface OrderQuestion extends BaseQuestion {
  type: 'order';
  items: string[];
}
export type Question =
  TrueFalseQuestion | SingleChoiceQuestion | ClozeQuestion | MatchQuestion | OrderQuestion;
export interface QuestionProgress {
  box: number;
  due: string;
  attempts: number;
  correct: number;
  wrong: number;
}
export interface Progress {
  schemaVersion: 1;
  totalXp: number;
  courseXp: Record<string, number>;
  dailyGoal: 10 | 20 | 30 | 50;
  dailyXp: Record<string, number>;
  goalDays: string[];
  crowns: Record<string, number>;
  questions: Record<string, QuestionProgress>;
  bestScores: Record<string, number>;
  sessionsCompleted: number;
}
export interface CourseContent {
  course: Course;
  law: Law;
  questions: Question[];
  demo: boolean;
  cases?: Cases;
  briefs?: CaseBriefs;
}
export interface Clock {
  now(): Date;
}
export type SessionMode = 'lesson' | 'unit' | 'review' | 'article' | 'case';
export interface Session {
  queue: Question[];
  initialCount: number;
  hearts: number;
  attempts: number;
  correct: number;
  firstAnswers: Record<string, boolean>;
  status: 'active' | 'complete' | 'failed';
  startedAt: number;
}
export interface SessionResult {
  success: boolean;
  xp: number;
  accuracy: number;
  seconds: number;
  title: string;
  returnTo: string;
  retryTo: string;
}

export interface PracticeConfig {
  courseId: string;
  pool: Question[];
  title: string;
  mode: SessionMode;
  crown: number;
  lessonId?: string;
  caseIds?: string[];
  allowed: boolean;
  returnTo: string;
}
