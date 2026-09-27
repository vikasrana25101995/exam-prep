'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/modules/auth/service';
import { listAttempts, listTests } from '@/modules/test/service';

// "Start Mock N": first test in this exam/stage the user hasn't taken, else the newest one.
export async function startNextMockAction(exam, stage) {
  const user = await requireUser();
  const [tests, attempts] = await Promise.all([listTests(), listAttempts(user.id)]);
  const pool = tests.filter((t) => t.exam === exam && t.stage === stage);
  if (!pool.length) redirect('/tests');
  const taken = new Set(attempts.map((a) => a.testId));
  const next = pool.find((t) => !taken.has(t.id)) ?? pool.at(-1);
  redirect(`/test/${next.id}`);
}
