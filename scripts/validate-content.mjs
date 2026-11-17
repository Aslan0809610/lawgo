import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const questionTypes = ['true_false', 'single_choice', 'cloze', 'match', 'order'];
const allowedTags = ['deadline', 'definition', 'procedure', 'comparison', 'case'];
const normalize = (value) => value.replace(/\s/gu, '');
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const strings = (value) => Array.isArray(value) && value.every(nonempty);
const unique = (values) => new Set(values).size === values.length;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}

function validateCommon(question, lessonIds, ids, fail) {
  const lessonPrefix = String(question.lessonId).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idPattern = new RegExp(`^${lessonPrefix}-q\\d{2}$`);
  if (!nonempty(question.id) || !nonempty(question.lessonId) || !idPattern.test(question.id)) {
    fail('id 格式應為 <lessonId>-qNN');
  }
  if (ids.has(question.id)) fail('id 重複');
  ids.add(question.id);
  if (!lessonIds.has(question.lessonId)) fail('lessonId 不存在於課程');
  if (!questionTypes.includes(question.type)) fail('未知的題型');
  if (![1, 2, 3].includes(question.difficulty)) fail('difficulty 必須為 1、2 或 3');
  if (!Array.isArray(question.tags) || !question.tags.every((tag) => allowedTags.includes(tag))) {
    fail('tags 必須為合法標籤陣列');
  }
  if (!nonempty(question.prompt)) fail('prompt 必須是非空字串');
  if (!nonempty(question.explanation)) fail('explanation 必須是非空字串');
}

function validateEvidence(question, articles, fail) {
  if (!Array.isArray(question.evidence) || question.evidence.length === 0) {
    fail('evidence 必須是非空陣列');
    return;
  }
  for (const evidence of question.evidence) {
    if (!object(evidence) || !nonempty(evidence.article) || !nonempty(evidence.quote)) {
      fail('evidence 的 article、quote 必須是非空字串');
      continue;
    }
    if (!articles.has(evidence.article)) {
      fail(`evidence 引用不存在的第 ${evidence.article} 條`);
    } else if (!normalize(articles.get(evidence.article)).includes(normalize(evidence.quote))) {
      fail(`第 ${evidence.article} 條找不到 evidence.quote「${evidence.quote}」`);
    }
  }
}

function validateSingleChoice(question, fail) {
  if (!strings(question.options) || question.options.length !== 4 || !unique(question.options)) {
    fail('options 必須為 4 個不重複的非空字串');
  }
  const answer = question.answerIndex;
  if (!Number.isInteger(answer) || answer < 0 || answer > 3) {
    fail('answerIndex 必須介於 0–3');
  }
}

function validPlaceholders(text, blanks) {
  const placeholders = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((match) => match[1]);
  const remaining = text.replace(/\{\{\d+\}\}/g, '');
  return (
    placeholders.length === blanks.length &&
    unique(placeholders) &&
    blanks.every((_, index) => placeholders.includes(String(index))) &&
    !/\{\{|\}\}/.test(remaining)
  );
}

function validateCloze(question, articles, fail) {
  const blanksValid =
    strings(question.blanks) && question.blanks.length >= 1 && question.blanks.length <= 3;
  if (!blanksValid) fail('blanks 必須有 1–3 個非空字串');
  if (
    !strings(question.distractors) ||
    question.distractors.length < 2 ||
    question.distractors.length > 4
  ) {
    fail('distractors 必須有 2–4 個非空字串');
  }
  if (
    strings(question.distractors) &&
    strings(question.blanks) &&
    question.distractors.some((word) => question.blanks.includes(word))
  ) {
    fail('distractors 不得與 blanks 重複');
  }
  if (!nonempty(question.text)) {
    fail('text 必須是非空字串');
    return;
  }
  if (!blanksValid) return;
  if (!validPlaceholders(question.text, question.blanks)) {
    fail('{{n}} 必須依 blanks 索引各出現一次，數量須等於 blanks 長度');
  }
  const filled = question.text.replace(
    /\{\{(\d+)\}\}/g,
    (_, index) => question.blanks[Number(index)] ?? '',
  );
  const citedArticleContains = (evidence) =>
    object(evidence) &&
    articles.has(evidence.article) &&
    normalize(articles.get(evidence.article)).includes(normalize(filled));
  if (!Array.isArray(question.evidence) || !question.evidence.some(citedArticleContains)) {
    fail('填空後的 text 不是 evidence 所引條文的連續片段');
  }
}

function validPair(pair) {
  return (
    object(pair) &&
    nonempty(pair.left) &&
    nonempty(pair.right) &&
    [...pair.left].length <= 16 &&
    [...pair.right].length <= 16
  );
}

function validateMatch(question, fail) {
  if (
    !Array.isArray(question.pairs) ||
    question.pairs.length !== 4 ||
    !question.pairs.every(validPair)
  ) {
    fail('pairs 必須剛好 4 組，left、right 為非空字串且各 ≤16 字');
    return;
  }
  if (
    !unique(question.pairs.map((pair) => pair.left)) ||
    !unique(question.pairs.map((pair) => pair.right))
  ) {
    fail('pairs 的 left、right 各自不得重複');
  }
}

function validateSpecific(question, articles, fail) {
  switch (question.type) {
    case 'true_false':
      if (typeof question.answer !== 'boolean') fail('answer 必須是布林值');
      break;
    case 'single_choice':
      validateSingleChoice(question, fail);
      break;
    case 'cloze':
      validateCloze(question, articles, fail);
      break;
    case 'match':
      validateMatch(question, fail);
      break;
    case 'order':
      if (
        !strings(question.items) ||
        question.items.length < 3 ||
        question.items.length > 5 ||
        !unique(question.items)
      ) {
        fail('items 必須為 3–5 個不重複的非空字串');
      }
      break;
  }
}

function summarizeLessons(questions, lessons, coverage, errors) {
  const summary = [];
  for (const lesson of lessons) {
    const related = questions.filter(
      (question) => object(question) && question.lessonId === lesson.id,
    );
    const kinds = [...new Set(related.map((question) => question.type))];
    if (coverage || related.length) {
      const heading = `${lesson.id} ${lesson.title}`;
      const counts = `${related.length} 題／${kinds.length} 種題型`;
      const typeList = kinds.length ? `（${kinds.join(', ')}）` : '';
      summary.push(`${heading}：${counts}${typeList}`);
    }
    if (coverage && related.length < 8) {
      errors.push(`${lesson.id}：每課至少 8 題，目前 ${related.length} 題`);
    }
    if (coverage && kinds.filter((type) => questionTypes.includes(type)).length < 3) {
      errors.push(`${lesson.id}：每課至少 3 種題型`);
    }
  }
  return summary;
}

export function validateQuestions(questions, course, law, { coverage = true } = {}) {
  if (!Array.isArray(questions)) return { errors: ['題庫：必須是 JSON 陣列'], summary: [] };
  const errors = [];
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const articles = new Map(law.articles.map((article) => [article.no, article.text]));
  const ids = new Set();

  for (const [index, question] of questions.entries()) {
    const label = object(question) && nonempty(question.id) ? question.id : `第 ${index + 1} 題`;
    const fail = (message) => errors.push(`${label}：${message}`);
    if (!object(question)) {
      fail('題目必須是物件');
      continue;
    }
    validateCommon(question, lessonIds, ids, fail);
    validateEvidence(question, articles, fail);
    validateSpecific(question, articles, fail);
  }
  return { errors, summary: summarizeLessons(questions, lessons, coverage, errors) };
}

function discoverCourses(root) {
  const directory = path.join(root, 'content/courses');
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && fs.existsSync(path.join(directory, entry.name, 'course.json')),
    )
    .map((entry) => ({
      dir: path.join(directory, entry.name),
      course: readJson(path.join(directory, entry.name, 'course.json')),
    }));
}

function courseTargets(courses, file, single) {
  if (!file) return courses;
  const owned = courses.filter(({ dir }) => file.startsWith(`${dir}${path.sep}`));
  if (owned.length === 1) return owned;
  const matches = courses.filter(
    ({ course }) =>
      Array.isArray(single) &&
      single.some((question) =>
        course.units.some((unit) =>
          unit.lessons.some((lesson) => lesson.id === question?.lessonId),
        ),
      ),
  );
  if (matches.length !== 1) {
    throw new Error('單檔題庫無法唯一對應課程，請放入對應課程目錄');
  }
  return matches;
}

function readQuestionFiles(directory, errors) {
  const questionDirectory = path.join(directory, 'questions');
  if (!fs.existsSync(questionDirectory)) return [];
  const files = fs
    .readdirSync(questionDirectory)
    .filter((filename) => filename.endsWith('.json') && !filename.startsWith('_'))
    .sort();
  const questions = [];
  for (const filename of files) {
    try {
      const parsed = readJson(path.join(questionDirectory, filename));
      if (!Array.isArray(parsed)) errors.push(`${filename}：題庫必須是 JSON 陣列`);
      else questions.push(...parsed);
    } catch (error) {
      errors.push(`${filename}：${error.message}`);
    }
  }
  return questions;
}

function printReport(summaries, errors) {
  summaries.forEach((line) => console.log(line));
  if (errors.length) {
    console.error(`\n驗證失敗：${errors.length} 個錯誤`);
    errors.forEach((error) => console.error(`  ✗ ${error}`));
    return 1;
  }
  console.log('\n驗證通過：0 個錯誤');
  return 0;
}

export function run(args, root = process.cwd()) {
  if (args.length && (args.length !== 2 || args[0] !== '--file')) {
    console.error('用法：npm run validate [-- --file <path>]');
    return 1;
  }
  const file = args.length ? path.resolve(root, args[1]) : null;
  const errors = [];
  const summaries = [];
  try {
    const courses = discoverCourses(root);
    const single = file ? readJson(file) : null;
    const targets = courseTargets(courses, file, single);
    if (targets.length === 0) throw new Error('找不到題庫對應的課程');

    for (const { dir, course } of targets) {
      const questions = file ? single : readQuestionFiles(dir, errors);
      const law = readJson(path.join(root, 'content', course.lawFile));
      const result = validateQuestions(questions, course, law, { coverage: !file });
      const mode = file ? '單檔驗證（略過整課題數與題型配額）' : '完整課程驗證';
      summaries.push(`【${course.title}】${mode}`, ...result.summary);
      errors.push(...result.errors.map((error) => `${course.id} / ${error}`));
    }
  } catch (error) {
    errors.push(error.message);
  }
  return printReport(summaries, errors);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) process.exitCode = run(process.argv.slice(2));
