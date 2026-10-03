'use server';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/modules/auth/service';
import { MAX_PRACTICE_MIN } from '../constants';
import { getTest, saveAttempt, savePractice } from '../service';

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

export async function submitPracticeAction(testId, sectionId, minutes, responses, timeUsedSec) {
  const user = await requireUser();
  const test = await getTest(testId);
  const section = test?.sections.find((x) => x.id === sectionId);
  if (!section) return { error: 'This section no longer exists.' };
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_PRACTICE_MIN) return { error: 'Invalid practice time.' };
  const clean = responses && typeof responses === 'object' ? responses : {};
  // Client-reported, display only (same trust as the timer itself).
  const used = Math.min(minutes * 60, Math.max(0, Math.round(Number(timeUsedSec) || 0)));
  const id = await savePractice(user, test, section, minutes, used, clean);
  revalidatePath('/practice');
  return { id };
}
