import 'server-only';
import { randomUUID } from 'crypto';
import { readDb, updateDb } from '@/lib/db';
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
  return (await readDb()).tests;
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

// Keeps existing section/question ids so in-progress attempts still line up.
export async function updateTest(id, test) {
  return updateDb((db) => {
    const i = db.tests.findIndex((t) => t.id === id);
    if (i === -1) return null;
    db.tests[i] = withIds({ ...test, id, createdAt: db.tests[i].createdAt, updatedAt: new Date().toISOString() });
    return db.tests[i];
  });
}

// Past attempts keep their scores and testTitle, so history survives a delete.
export async function deleteTest(id) {
  await updateDb((db) => { db.tests = db.tests.filter((t) => t.id !== id); });
}

export async function listAllAttempts() {
  return (await readDb()).attempts;
}
