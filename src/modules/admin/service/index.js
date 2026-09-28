import { EXAMS, STAGES } from '../../../constants';
import { band } from '../../dashboard/constants/index.js';
import { buildDashboard } from '../../dashboard/service/index.js';
import { AI_MAX_PER_SECTION, DIFFICULTIES, MAX_OPTIONS, MAX_SECTIONS, TEMPLATES } from '../constants';

const keepId = (v) => (typeof v === 'string' && v.length <= 64 ? { id: v } : {});
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Validates admin input and returns a clean test (answers re-indexed after blank options are dropped).
export function validateTest(input) {
  const errors = [];
  const title = str(input?.title, 200);
  if (!title) errors.push('Give the test a title.');
  const exam = EXAMS.find((e) => e.id === input?.exam && e.live)?.id;
  if (!exam) errors.push('Pick a live exam.');
  const stage = STAGES.find((s) => s.id === input?.stage)?.id;
  if (!stage) errors.push('Pick a stage.');
  const negativeMark = Number(input?.negativeMark);
  if (!(negativeMark >= 0 && negativeMark <= 1)) errors.push('Negative marking must be between 0 and 1.');

  const rawSections = Array.isArray(input?.sections) ? input.sections : [];
  if (!rawSections.length || rawSections.length > MAX_SECTIONS) errors.push(`Add 1–${MAX_SECTIONS} sections.`);

  const sections = rawSections.slice(0, MAX_SECTIONS).map((sec, si) => {
    const where = `Section ${si + 1}`;
    const name = str(sec?.name, 100);
    if (!name) errors.push(`${where}: add a name.`);
    const durationMin = Number(sec?.durationMin);
    if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 300) errors.push(`${where}: time must be 1–300 whole minutes.`);
    const rawQs = Array.isArray(sec?.questions) ? sec.questions : [];
    if (!rawQs.length) errors.push(`${where}: add at least one question.`);

    const questions = rawQs.map((q, qi) => {
      const at = `${where}, Q${qi + 1}`;
      const text = str(q?.text, 5000);
      if (!text) errors.push(`${at}: question text is empty.`);
      const kept = (Array.isArray(q?.options) ? q.options : []).slice(0, MAX_OPTIONS)
        .map((o, i) => ({ text: str(o, 1000), i }))
        .filter((o) => o.text);
      if (kept.length < 2) errors.push(`${at}: needs at least 2 options.`);
      const answer = kept.findIndex((o) => o.i === q?.answer);
      if (answer === -1) errors.push(`${at}: the correct answer must be a filled option.`);
      return { ...keepId(q?.id), text, options: kept.map((o) => o.text), answer, topic: str(q?.topic, 100) };
    });
    return { ...keepId(sec?.id), name, durationMin, questions };
  });

  return errors.length ? { errors } : { test: { title, exam, stage, negativeMark, sections } };
}

const qCount = (t) => t.sections.reduce((a, s) => a + s.questions.length, 0);
const pct = (a) => (a.max ? (a.total / a.max) * 100 : 0);

// Pure: numbers for the admin dashboard.
export function buildAdminStats({ tests, attempts, users, recent = 10 }) {
  const byTest = Object.groupBy(attempts, (a) => a.testId);
  const emails = Object.fromEntries(users.map((u) => [u.id, u.email]));
  const avg = (xs) => (xs.length ? xs.reduce((s, a) => s + pct(a), 0) / xs.length : null);
  return {
    totals: {
      tests: tests.length,
      students: users.filter((u) => u.role !== 'admin').length,
      attempts: attempts.length,
      avgPct: avg(attempts),
    },
    tests: tests
      .map((t) => ({
        id: t.id,
        title: t.title,
        exam: t.exam,
        stage: t.stage,
        questions: qCount(t),
        minutes: t.sections.reduce((a, s) => a + s.durationMin, 0),
        attempts: byTest[t.id]?.length ?? 0,
        avgPct: avg(byTest[t.id] ?? []),
        createdAt: t.createdAt,
      }))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    students: buildStudentRows(users, attempts),
    recent: attempts
      .toSorted((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, recent)
      .map((a) => ({ id: a.id, userId: a.userId, who: emails[a.userId] ?? 'Deleted user', test: a.testTitle, total: a.total, max: a.max, at: a.submittedAt })),
  };
}

// Pure: turns pasted JSON into builder state. Server validation still runs on save.
export function parseImport(text, pad) {
  const data = JSON.parse(text);
  if (!Array.isArray(data?.sections)) throw new Error('JSON needs a "sections" array.');
  return {
    title: String(data.title ?? ''),
    exam: data.exam ?? 'banking',
    stage: data.stage ?? 'prelims',
    negativeMark: data.negativeMark ?? 0.25,
    sections: data.sections.map((s) => ({
      name: String(s.name ?? ''),
      durationMin: s.durationMin ?? 20,
      questions: (s.questions ?? []).map((q) => ({
        text: String(q.text ?? ''),
        options: Array.from({ length: pad }, (_, i) => String(q.options?.[i] ?? '')),
        // Accept 0-based index or a letter ("B").
        answer: typeof q.answer === 'string' ? 'ABCDE'.indexOf(q.answer.toUpperCase()) : Number(q.answer ?? 0),
        topic: String(q.topic ?? ''),
      })),
    })),
  };
}

// ---- AI question generation (pure parts; the Claude call is in ./ai.js) ----

// paper: 'full' for every section of the stage, or one section name for sectional practice.
export function validateGenerateOptions(input) {
  const errors = [];
  const exam = EXAMS.find((e) => e.id === input?.exam && e.live)?.id;
  if (!exam) errors.push('Pick a live exam.');
  const stage = STAGES.find((s) => s.id === input?.stage)?.id;
  if (!stage) errors.push('Pick prelims or mains.');
  const difficulty = DIFFICULTIES.find((d) => d.id === input?.difficulty)?.id;
  if (!difficulty) errors.push('Pick a difficulty.');
  const template = TEMPLATES[exam]?.[stage] ?? [];
  const paper = input?.paper === 'full' || template.some((t) => t.name === input?.paper) ? input.paper : null;
  if (!paper) errors.push('Pick a paper type.');
  const count = Number(input?.count);
  if (!Number.isInteger(count) || count < 1 || count > AI_MAX_PER_SECTION) errors.push(`Questions per section must be 1–${AI_MAX_PER_SECTION}.`);
  const focus = str(input?.focus, 300);
  if (errors.length) return { errors };
  const sections = template
    .filter((t) => paper === 'full' || t.name === paper)
    .map((t) => ({ name: t.name, count, durationMin: Math.max(3, Math.round((t.durationMin * count) / t.count)) }));
  return { opts: { exam, stage, difficulty, paper, count, focus, sections } };
}

export const GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string', description: 'Full question, self-contained. Put any table or passage inside the text.' },
                options: { type: 'array', items: { type: 'string' }, description: 'Exactly 5 options, no letter prefixes.' },
                answer: { type: 'integer', enum: [0, 1, 2, 3, 4], description: '0-based index of the single correct option.' },
                topic: { type: 'string', description: 'Short syllabus topic, e.g. "Number series".' },
              },
              required: ['text', 'options', 'answer', 'topic'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'questions'],
        additionalProperties: false,
      },
    },
  },
  required: ['sections'],
  additionalProperties: false,
};

export const GENERATION_SYSTEM = `You write original practice questions for Indian bank recruitment exams (IBPS PO, SBI PO, IBPS/SBI Clerk).
Match the real exam's style, syllabus and difficulty for the requested stage and section.
Every question is multiple choice with exactly 5 options and exactly one correct answer.
Before finalising a question, solve it yourself and make sure the marked answer is correct and no other option is also correct.
Questions must be fully self-contained text: no images, no references to figures. Give data-interpretation tables and reading passages inline in the question text (you may reuse one passage or table across a few consecutive questions by repeating it).
Spread correct answers across positions A–E and vary topics across the section's usual syllabus.
Write original questions; do not copy questions from past papers or coaching material.`;

export function buildGenerationPrompt(opts) {
  const level = DIFFICULTIES.find((d) => d.id === opts.difficulty);
  const lines = [
    `Exam: ${EXAMS.find((e) => e.id === opts.exam).name} ${STAGES.find((s) => s.id === opts.stage).name}.`,
    `Difficulty: ${level.label} - ${level.brief}`,
    'Sections to write (use these names exactly):',
    ...opts.sections.map((s) => `- ${s.name}: ${s.count} questions`),
  ];
  if (opts.focus) lines.push(`Focus on these topics where they fit the section: ${opts.focus}`);
  return lines.join('\n');
}

// Claude's JSON -> builder state, with the paper's title, timings and marking.
export function assembleGenerated(opts, output) {
  const level = DIFFICULTIES.find((d) => d.id === opts.difficulty).label;
  const stage = STAGES.find((s) => s.id === opts.stage).name;
  const byName = Object.fromEntries((output?.sections ?? []).map((s) => [s.name, s.questions ?? []]));
  return parseImport(JSON.stringify({
    title: `${EXAMS.find((e) => e.id === opts.exam).name} ${stage} · ${level} practice${opts.paper === 'full' ? '' : ` · ${opts.paper}`}`,
    exam: opts.exam,
    stage: opts.stage,
    negativeMark: 0.25,
    sections: opts.sections.map((s, i) => ({ name: s.name, durationMin: s.durationMin, questions: byName[s.name] ?? output?.sections?.[i]?.questions ?? [] })),
  }), MAX_OPTIONS);
}

// ---- Students ----

export function buildStudentRows(users, attempts) {
  const byUser = Object.groupBy(attempts, (a) => a.userId);
  return users
    .filter((u) => u.role !== 'admin')
    .map((u) => {
      const mine = byUser[u.id] ?? [];
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        active: u.active,
        attempts: mine.length,
        avgPct: mine.length ? mine.reduce((s, a) => s + pct(a), 0) / mine.length : null,
        lastAt: mine.map((a) => a.submittedAt).sort().at(-1) ?? null,
      };
    })
    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? '') || a.email.localeCompare(b.email));
}

// One dashboard per exam+stage, since prelims and mains have different sections.
export function buildStudentDetail(attempts) {
  const sorted = attempts.toSorted((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const groups = Object.groupBy(sorted, (a) => `${a.exam}|${a.stage}`);
  return Object.entries(groups).map(([key, list]) => {
    const [exam, stage] = key.split('|');
    const data = buildDashboard(list);
    return {
      exam,
      stage,
      data,
      avgPct: list.reduce((s, a) => s + pct(a), 0) / list.length,
      best: Math.max(...list.map((a) => a.total)),
      strongTopics: data.topics.toReversed().filter((t) => band(t.accuracy) === 'high').slice(0, 5),
      weakTopics: data.topics.filter((t) => band(t.accuracy) === 'low').slice(0, 5),
    };
  });
}
