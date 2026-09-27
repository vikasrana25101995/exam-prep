// Run: npm run check — asserts the pure logic (scoring, admin validation, dashboard stats).
import assert from 'node:assert/strict';
import { scoreAttempt } from '../src/modules/test/service/scoring.js';
import { validateTest } from '../src/modules/admin/service/index.js';
import { buildDashboard } from '../src/modules/dashboard/service/index.js';
import { SAMPLE_ATTEMPTS } from '../src/modules/dashboard/constants/index.js';

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
const bad = validateTest({ title: '', exam: 'ssc', stage: 'x', negativeMark: 2,
  sections: [{ name: '', durationMin: 0, questions: [{ text: '', options: ['a', ''], answer: 1 }] }] });
assert.equal(bad.errors.length, 9);

const d = buildDashboard(SAMPLE_ATTEMPTS);
assert.equal(d.latest.total, 69.5);
assert.equal(d.latest.delta, 2.25);
assert.equal(d.trend[0].total, 58.25);
assert.equal(d.sections.find((s) => s.tag === 'top').name, 'Reasoning Ability');
assert.equal(d.sections.find((s) => s.tag === 'low').name, 'Quantitative Aptitude');
assert.equal(d.workOn[0].topic, 'Data Interpretation');
assert.equal(buildDashboard([]), null);
console.log('all checks passed');
