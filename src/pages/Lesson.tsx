import { useState } from 'react';
import { CasePreview } from '../components/CasePreview';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Feedback } from '../components/Feedback';
import { useContent } from '../components/Layout';
import { QuestionRenderer } from '../components/questions';
import { SessionToolbar } from '../components/SessionToolbar';
import { useLessonSession } from '../hooks/useLessonSession';
import { progressStore, useProgress } from '../store';
import type { CourseContent, PracticeConfig, Question } from '../types';
import { resolvePractice } from './lessonConfig';

const typeNames: Record<Question['type'], string> = {
  true_false: '是非題',
  single_choice: '單選題',
  cloze: '克漏字',
  match: '配對題',
  order: '排序題',
};

export function Lesson() {
  const content = useContent();
  const progress = useProgress();
  const params = useParams();
  const location = useLocation();
  const config = resolvePractice(
    content,
    progress,
    params,
    location.search,
    progressStore.clock.now(),
  );
  const retryTo = `${location.pathname}${location.search}`;

  if (!config.allowed) {
    return (
      <section className="empty">
        <h1>這個練習尚未解鎖</h1>
        <p>完成前一課，就能繼續向前。</p>
        <Link className="primary" to={`/${content.course.id}/path`}>
          回到學習之路
        </Link>
      </section>
    );
  }
  return (
    <LessonEntry
      key={`${content.course.id}:${retryTo}`}
      config={config}
      content={content}
      retryTo={retryTo}
    />
  );
}

function LessonEntry({
  config,
  content,
  retryTo,
}: {
  config: PracticeConfig;
  content: CourseContent;
  retryTo: string;
}) {
  const [started, setStarted] = useState(false);
  const cases = (config.caseIds ?? []).flatMap(
    (id) => content.cases?.articles.filter((item) => item.no === id) ?? [],
  );
  if (!started && cases.length > 0 && config.pool.length > 0) {
    return (
      <CasePreview
        cases={cases}
        briefs={content.briefs}
        language={content.course.language}
        onStart={() => setStarted(true)}
      />
    );
  }
  return <SessionPlayer config={config} content={content} retryTo={retryTo} />;
}

function SessionPlayer({
  config,
  content,
  retryTo,
}: {
  config: PracticeConfig;
  content: CourseContent;
  retryTo: string;
}) {
  const round = useLessonSession(config, retryTo);
  const { session, question, feedback } = round;

  if (!question) {
    return (
      <section className="empty">
        <span className="empty-icon">▤</span>
        <h1>目前沒有可練習的題目</h1>
        <p>這個範圍或難度的題庫準備中。先讀一條法條，也是一種前進。</p>
        <Link className="primary" to={config.returnTo}>
          返回
        </Link>
      </section>
    );
  }
  const solved = session.initialCount - session.queue.length;

  return (
    <div className="lesson-page">
      <SessionToolbar
        returnTo={config.returnTo}
        solved={solved}
        total={session.initialCount}
        hearts={feedback?.next.hearts ?? session.hearts}
      />
      <p className="session-title">{config.title}</p>
      <div className="question-meta">
        <span>{typeNames[question.type]}</span>
        <span>
          已完成 {solved} / {session.initialCount}
        </span>
      </div>
      <h1 className="question-prompt">{question.prompt}</h1>
      <div lang={content.course.language ?? 'zh'}>
        <QuestionRenderer
          key={`${question.id}:${session.attempts}`}
          question={question}
          onAnswer={round.answer}
        />
      </div>
      {feedback && (
        <Feedback
          correct={feedback.correct}
          question={question}
          law={content.law}
          cases={content.cases}
          briefs={content.briefs}
          language={content.course.language}
          onContinue={round.continueSession}
        />
      )}
    </div>
  );
}
