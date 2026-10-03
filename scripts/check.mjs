// Run: npm run check — asserts the pure logic (scoring, admin validation, dashboard stats).
import assert from 'node:assert/strict';
import { scoreAttempt, scorePractice } from '../src/modules/test/service/scoring.js';
import { validateTest } from '../src/modules/admin/service/index.js';
import { buildDashboard } from '../src/modules/dashboard/service/index.js';

const test = {
  negativeMark: 0.25,
  sections: [
    { name: 'A', questions: [{ id: 'q1', options: ['x', 'y'], answer: 0, topic: 'T1' }, { id: 'q2', options: ['x', 'y'], answer: 1, topic: 'T1' }, { id: 'q3', options: ['x', 'y'], answer: 1 }] },
    { name: 'B', questions: [{ id: 'q4', options: ['x', 'y'], answer: 0 }] },
  ],
};
const r = scoreAttempt(test, { q1: 0, q2: 0, q3: 9, q4: '0' }); // q3 out of range, q4 wrong type -> ignored
assert.equal(r.sections[0].correct, 1);
assert.equal(r.sections[0].wrong, 1);
assert.equal(r.sections[0].score, 0.75);
assert.equal(r.sections[1].attempted, 0);
assert.equal(r.total, 0.75);
assert.equal(r.max, 4);
assert.deepEqual(r.topics, [{ section: 'A', topic: 'T1', attempted: 2, correct: 1 }]);

const ok = validateTest({ title: ' T ', exam: 'banking', stage: 'prelims', negativeMark: 0.25,
  sections: [{ name: 'S', durationMin: 20, questions: [{ text: 'Q', options: ['', 'a', '', 'b', ''], answer: 3, topic: '' }] }] });
assert.equal(ok.errors, undefined);
assert.deepEqual(ok.test.sections[0].questions[0].options, ['a', 'b']);
assert.equal(ok.test.sections[0].questions[0].answer, 1, 'answer re-indexed after blanks dropped');
const bad = validateTest({ title: '', exam: 'railways', stage: 'x', negativeMark: 2,
  sections: [{ name: '', durationMin: 0, questions: [{ text: '', options: ['a', ''], answer: 1 }] }] });
assert.equal(bad.errors.length, 9);

// Six-mock fixture for the dashboard stats checks.
const sec = (name, max, correct, wrong) => ({ name, max, correct, wrong, attempted: correct + wrong, score: correct - wrong * 0.25 });
const mock = (i, e, q, r, topics = []) => {
  const sections = [sec('English Language', 30, ...e), sec('Quantitative Aptitude', 35, ...q), sec('Reasoning Ability', 35, ...r)];
  return { id: `sample-${i}`, submittedAt: `2026-0${i}-01`, sections, topics, max: 100, total: sections.reduce((a, s) => a + s.score, 0) };
};
const t = (section, topic, correct, attempted) => ({ section, topic, correct, attempted });

const SAMPLE_ATTEMPTS = [
  mock(1, [20, 4], [15, 6], [27, 5]),
  mock(2, [21, 4], [17, 6], [28, 4]),
  mock(3, [21, 5], [17, 5], [27, 3]),
  mock(4, [22, 4], [19, 6], [26, 2]),
  mock(5, [23, 5], [21, 8], [27, 2]),
  mock(6, [23, 3], [22, 9], [28, 2], [
    t('Quantitative Aptitude', 'Data Interpretation', 26, 50),
    t('Quantitative Aptitude', 'Arithmetic word problems', 22, 40),
    t('Quantitative Aptitude', 'Number series', 37, 50),
    t('Quantitative Aptitude', 'Quadratic equations', 39, 50),
    t('Quantitative Aptitude', 'Simplification', 41, 50),
    t('English Language', 'Error spotting', 32, 50),
    t('English Language', 'Reading comprehension', 45, 60),
    t('English Language', 'Para jumbles', 42, 48),
    t('English Language', 'Fill in the blanks', 40, 46),
    t('Reasoning Ability', 'Puzzles', 40, 52),
    t('Reasoning Ability', 'Syllogism', 30, 32),
    t('Reasoning Ability', 'Inequality', 28, 30),
    t('Reasoning Ability', 'Blood relations', 25, 28),
  ]),
];

const d = buildDashboard(SAMPLE_ATTEMPTS);
assert.equal(d.latest.total, 69.5);
assert.equal(d.latest.delta, 2.25);
assert.equal(d.trend[0].total, 58.25);
assert.equal(d.sections.find((s) => s.tag === 'top').name, 'Reasoning Ability');
assert.equal(d.sections.find((s) => s.tag === 'low').name, 'Quantitative Aptitude');
assert.equal(d.workOn[0].topic, 'Data Interpretation');
assert.equal(buildDashboard([]), null);
console.log('all checks passed');

// Admin
import { buildAdminStats, parseImport } from '../src/modules/admin/service/index.js';
const st = buildAdminStats({
  tests: [{ id: 't1', title: 'A', exam: 'banking', stage: 'prelims', createdAt: '2026-01-01', sections: [{ durationMin: 20, questions: [{}, {}] }] }],
  attempts: [{ id: 'a1', testId: 't1', userId: 'u2', testTitle: 'A', total: 1, max: 2, submittedAt: '2026-01-02' }],
  users: [{ id: 'u1', role: 'admin', email: 'x' }, { id: 'u2', role: 'student', email: 's@x' }],
});
assert.deepEqual(st.totals, { tests: 1, students: 1, attempts: 1, avgPct: 50 });
assert.equal(st.tests[0].attempts, 1);
const imp = parseImport('{"sections":[{"name":"S","questions":[{"text":"Q","options":["a","b"],"answer":"B"}]}]}', 5);
assert.equal(imp.sections[0].questions[0].answer, 1);
assert.equal(imp.sections[0].questions[0].options.length, 5);
assert.equal(validateTest({ ...imp, title: 'T' }).errors, undefined, 'imported JSON passes validation');
assert.throws(() => parseImport('{}', 5));
const named = parseImport('{"exam":"SSC CGL","stage":"Prelims","sections":[]}', 5);
assert.deepEqual([named.exam, named.stage], ['ssc', 'prelims'], 'exam/stage accept display names');
const unknown = parseImport('{"exam":"nope","stage":"tier 9","sections":[]}', 5);
assert.deepEqual([unknown.exam, unknown.stage], ['banking', 'prelims'], 'unknown exam/stage fall back');
const kept = validateTest({ ...imp, title: 'T', sections: [{ ...imp.sections[0], id: 's1', durationMin: 20, questions: [{ ...imp.sections[0].questions[0], id: 'q1' }] }] });
assert.equal(kept.test.sections[0].questions[0].id, 'q1', 'ids survive an edit');
console.log('admin checks passed');

// AI generation (pure parts)
import { assembleGenerated, buildGenerationPrompt, validateGenerateOptions } from '../src/modules/admin/service/index.js';
const g = validateGenerateOptions({ exam: 'banking', stage: 'prelims', paper: 'Quantitative Aptitude', difficulty: 'hard', count: 10, focus: 'DI' });
assert.equal(g.errors, undefined);
assert.deepEqual(g.opts.sections, [{ name: 'Quantitative Aptitude', count: 10, durationMin: 6 }]); // 20 min * 10/35
assert.equal(validateGenerateOptions({ exam: 'banking', stage: 'mains', paper: 'full', difficulty: 'easy', count: 5 }).opts.sections.length, 4);
assert.equal(validateGenerateOptions({ exam: 'railways', stage: 'x', paper: 'Nope', difficulty: 'insane', count: 99 }).errors.length, 5);
assert.match(buildGenerationPrompt(g.opts), /Quantitative Aptitude: 10 questions/);
const drafted = assembleGenerated(g.opts, { sections: [{ name: 'Quant', questions: [{ text: '2+2?', options: ['1', '2', '3', '4', '5'], answer: 3, topic: 'Simplification' }] }] });
assert.equal(drafted.title, 'Banking Prelims · Hard practice · Quantitative Aptitude');
assert.equal(drafted.sections[0].questions.length, 1, 'falls back to position when section name differs');
assert.equal(validateTest(drafted).errors, undefined, 'AI draft is publishable');
console.log('ai checks passed');

// Students
import { buildStudentDetail, buildStudentRows } from '../src/modules/admin/service/index.js';
const rows = buildStudentRows(
  [{ id: 'u1', role: 'admin', email: 'a@x', active: true }, { id: 'u2', role: 'student', email: 's@x', active: false }, { id: 'u3', role: 'student', email: 'n@x', active: true }],
  SAMPLE_ATTEMPTS.map((a) => ({ ...a, userId: 'u2', exam: 'banking', stage: 'prelims', testTitle: 'T', submittedAt: `2026-0${a.id.at(-1)}-01` })),
);
assert.equal(rows.length, 2, 'admins are not listed');
assert.equal(rows[0].email, 's@x', 'most recently active first');
assert.equal(rows[0].attempts, 6);
assert.equal(rows[0].active, false);
assert.equal(rows[1].avgPct, null);
const det = buildStudentDetail(SAMPLE_ATTEMPTS.map((a, i) => ({ ...a, exam: 'banking', stage: i < 5 ? 'prelims' : 'mains', submittedAt: `2026-0${i + 1}-01` })));
assert.equal(det.length, 2, 'split by stage');
assert.equal(det[0].data.count, 5);
assert.equal(det[1].best, 69.5);
assert.ok(det[1].weakTopics.every((t) => t.accuracy < 65) && det[1].weakTopics[0].topic === 'Data Interpretation');
assert.ok(det[1].strongTopics.every((t) => t.accuracy >= 80));
console.log('student checks passed');

// Skipped sections are not ranked
const skip = buildDashboard([{ id: 'x', total: 3, max: 15, topics: [], sections: [
  { name: 'A', max: 5, attempted: 5, correct: 4, wrong: 1, score: 3.75 },
  { name: 'B', max: 5, attempted: 0, correct: 0, wrong: 0, score: 0 },
  { name: 'C', max: 5, attempted: 0, correct: 0, wrong: 0, score: 0 },
] }]);
assert.deepEqual(skip.sections.map((s) => s.tag), ['top', 'none', 'none']);
console.log('tag checks passed');

// Practice: one section, snapshot keeps the picks
const pr = scorePractice(test.sections[0], 0.25, { q1: 0, q2: 0, q3: 9 });
assert.deepEqual([pr.correct, pr.wrong, pr.score, pr.max], [1, 1, 0.75, 3]);
assert.deepEqual(pr.questions.map((q) => q.picked), [0, 0, null], 'out-of-range pick is skipped');
assert.equal(pr.questions[1].answer, 1);
console.log('practice checks passed');
