import { TrueFalse } from './TrueFalse';
import { SingleChoice } from './SingleChoice';
import { Cloze } from './Cloze';
import { Match } from './Match';
import { Order } from './Order';
import type { QuestionProps } from './types';

export function QuestionRenderer({ question, onAnswer }: QuestionProps) {
  switch (question.type) {
    case 'true_false':
      return <TrueFalse question={question} onAnswer={onAnswer} />;
    case 'single_choice':
      return <SingleChoice question={question} onAnswer={onAnswer} />;
    case 'cloze':
      return <Cloze question={question} onAnswer={onAnswer} />;
    case 'match':
      return <Match question={question} onAnswer={onAnswer} />;
    case 'order':
      return <Order question={question} onAnswer={onAnswer} />;
  }
}
