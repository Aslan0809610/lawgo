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
export interface Lesson {
  id: string;
  title: string;
  articles: string[];
}
export interface Unit {
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
  units: Unit[];
}
export type Tag = 'deadline' | 'definition' | 'procedure' | 'comparison' | 'case';
export interface Evidence {
  article: string;
  quote: string;
}
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
}
export interface Clock {
  now(): Date;
}
export type SessionMode = 'lesson' | 'unit' | 'review' | 'article';
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
  allowed: boolean;
  returnTo: string;
}
