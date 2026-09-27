'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/modules/auth/service';
import { getTest, saveAttempt } from '../service';

// ponytail: time limits are enforced in the browser only; add server-side
// start timestamps if cheating becomes a concern.
export async function submitTestAction(testId, responses) {
  const user = await requireUser();
  const test = await getTest(testId);
  if (!test) return { error: 'Test not found.' };
  const clean = responses && typeof responses === 'object' ? responses : {};
  const attempt = await saveAttempt(user, test, clean);
  revalidatePath('/dashboard');
  return {
    sections: attempt.sections.map((s) => ({ name: s.name, attempted: s.attempted, notAttempted: s.max - s.attempted })),
  };
}
