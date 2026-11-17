import type { Question } from '../../types';

export interface QuestionProps<Q extends Question = Question> {
  question: Q;
  onAnswer(correct: boolean): void;
}
