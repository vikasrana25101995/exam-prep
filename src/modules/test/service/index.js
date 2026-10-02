import 'server-only';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { scoreAttempt } from './scoring';

// Tests, sections, questions and attempts live in Supabase (see the schema SQL).
// Read with the secret key, so RLS keeps answers away from the public API.
const db = () => supabaseAdmin();
const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const idOr = (id) => (UUID.test(id ?? '') ? id : randomUUID());
// timestamp(3) columns come back without a zone; they are stored in UTC.
const iso = (v) => v && new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(v) ? v : `${v}Z`).toISOString();
const byPosition = (a, b) => a.position - b.position;

const TEST_SELECT = '*, sections(*, questions(*))';
const toTest = (t) => ({
  id: t.id,
  title: t.title,
  exam: t.exam,
  stage: t.stage,
  negativeMark: t.negative_mark,
  createdAt: iso(t.created_at),
  ...(t.updated_at && { updatedAt: iso(t.updated_at) }),
  sections: t.sections.toSorted(byPosition).map((s) => ({
    id: s.id,
    name: s.name,
    durationMin: s.duration_min,
    questions: s.questions.toSorted(byPosition).map((q) => ({ id: q.id, text: q.text, options: q.options, answer: q.answer, topic: q.topic })),
  })),
});

const toAttempt = (a) => ({
  id: a.id,
  userId: a.user_id,
  testId: a.test_id,
  testTitle: a.test_title,
  exam: a.exam,
  stage: a.stage,
  submittedAt: iso(a.submitted_at),
  sections: a.sections,
  topics: a.topics,
  total: a.total,
  max: a.max,
});

// ponytail: several requests, not one transaction. Upserts run before deletes, so a failure
// leaves stale rows rather than losing any; move to a Postgres function if that bites.
async function writeTest(test) {
  const sections = test.sections.map((s) => ({ ...s, id: idOr(s.id), questions: s.questions.map((q) => ({ ...q, id: idOr(q.id) })) }));
  const questions = sections.flatMap((s) => s.questions.map((q, i) => ({
    id: q.id, section_id: s.id, position: i, text: q.text, options: q.options, answer: q.answer, topic: q.topic ?? '',
  })));

  must(await db().from('tests').upsert({
    id: test.id, title: test.title, exam: test.exam, stage: test.stage, negative_mark: test.negativeMark,
    ...(test.updatedAt && { updated_at: test.updatedAt }),
  }));
  must(await db().from('sections').upsert(sections.map((s, i) => ({ id: s.id, test_id: test.id, position: i, name: s.name, duration_min: s.durationMin }))));
  must(await db().from('questions').upsert(questions));

  // Drop whatever an edit removed (questions inside removed sections go by cascade).
  const list = (rows) => `(${rows.map((r) => r.id).join(',')})`;
  must(await db().from('sections').delete().eq('test_id', test.id).not('id', 'in', list(sections)));
  must(await db().from('questions').delete().in('section_id', sections.map((s) => s.id)).not('id', 'in', list(questions)));
}

export async function listTests() {
  return must(await db().from('tests').select(TEST_SELECT).order('created_at')).map(toTest);
}

export async function getTest(id) {
  if (!UUID.test(id ?? '')) return null;
  const row = must(await db().from('tests').select(TEST_SELECT).eq('id', id).maybeSingle());
  return row && toTest(row);
}

// What the browser gets while taking a test: no answers.
export function toPublicTest(test) {
  return {
    ...test,
    sections: test.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map(({ answer, ...qn }) => qn),
    })),
  };
}

// New test: fresh ids everywhere, so pasted JSON can't point at another test's rows.
export async function saveTest(test) {
  const full = { ...test, id: randomUUID(), sections: test.sections.map(({ id: _sid, ...s }) => ({ ...s, questions: s.questions.map(({ id: _qid, ...q }) => q) })) };
  await writeTest(full);
  return full;
}

// Keeps existing section/question ids so in-progress attempts still line up.
export async function updateTest(id, test) {
  if (!UUID.test(id ?? '')) return null;
  const found = must(await db().from('tests').select('id').eq('id', id).maybeSingle());
  if (!found) return null;
  await writeTest({ ...test, id, updatedAt: new Date().toISOString() });
  return true;
}

// Past attempts keep their scores and testTitle (test_id becomes null), so history survives a delete.
export async function deleteTest(id) {
  if (!UUID.test(id ?? '')) return;
  must(await db().from('tests').delete().eq('id', id));
}

export async function listAttempts(userId) {
  return must(await db().from('attempts').select().eq('user_id', userId).order('submitted_at')).map(toAttempt);
}

// ponytail: Supabase returns at most 1000 rows per request; page this once attempts grow past that.
export async function listAllAttempts() {
  return must(await db().from('attempts').select().order('submitted_at')).map(toAttempt);
}

export async function saveAttempt(user, test, responses) {
  const scored = scoreAttempt(test, responses);
  const row = must(await db().from('attempts').insert({
    user_id: user.id,
    test_id: test.id,
    test_title: test.title,
    exam: test.exam,
    stage: test.stage,
    submitted_at: new Date().toISOString(),
    ...scored,
  }).select().single());
  return toAttempt(row);
}
