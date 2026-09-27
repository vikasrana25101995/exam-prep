import 'server-only';
import { randomUUID } from 'crypto';
import { readDb, updateDb } from '@/lib/db';
import { SAMPLE_TEST } from '../constants';
import { scoreAttempt } from './scoring';

const withIds = (test) => ({
  ...test,
  id: test.id ?? randomUUID(),
  createdAt: test.createdAt ?? new Date().toISOString(),
  sections: test.sections.map((sec) => ({
    ...sec,
    id: sec.id ?? randomUUID(),
    questions: sec.questions.map((qn) => ({ ...qn, id: qn.id ?? randomUUID() })),
  })),
});

export async function listTests() {
  let { tests } = await readDb();
  if (tests.length === 0) {
    tests = await updateDb((db) => {
      if (db.tests.length === 0) db.tests.push(withIds(SAMPLE_TEST));
      return db.tests;
    });
  }
  return tests;
}

export async function getTest(id) {
  return (await listTests()).find((t) => t.id === id) ?? null;
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

export async function saveTest(test) {
  const full = withIds(test);
  await updateDb((db) => { db.tests.push(full); });
  return full;
}

export async function listAttempts(userId) {
  return (await readDb()).attempts
    .filter((a) => a.userId === userId)
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
}

export async function saveAttempt(user, test, responses) {
  const attempt = {
    id: randomUUID(),
    userId: user.id,
    testId: test.id,
    testTitle: test.title,
    exam: test.exam,
    stage: test.stage,
    submittedAt: new Date().toISOString(),
    ...scoreAttempt(test, responses),
  };
  await updateDb((db) => { db.attempts.push(attempt); });
  return attempt;
}
