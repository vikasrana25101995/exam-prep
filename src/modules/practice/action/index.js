'use server';
import { redirect } from 'next/navigation';
import { EXAMS, STAGES } from '@/constants';
import { requireUser } from '@/modules/auth/service';
import { MAX_PRACTICE_MIN } from '@/modules/test/constants';
import { MAX_PRACTICE_QUESTIONS } from '../constants';
import { pickRandom } from '../service';

// Picks a random set from the bank and opens the runner. Returns { error } if nothing matches.
export async function startPracticeAction(_prev, formData) {
  await requireUser();
  const exam = EXAMS.find((e) => e.id === formData.get('exam') && e.live)?.id;
  const stage = STAGES.find((s) => s.id === formData.get('stage'))?.id;
  const section = String(formData.get('section') ?? '').slice(0, 100);
  const topics = formData.getAll('topics').map((t) => String(t).slice(0, 100)).slice(0, 100);
  const count = Number(formData.get('count'));
  const minutes = Number(formData.get('minutes'));
  if (!exam || !stage || !section) return { error: 'Pick an exam, stage and section.' };
  if (!Number.isInteger(count) || count < 1 || count > MAX_PRACTICE_QUESTIONS) return { error: `Questions must be 1–${MAX_PRACTICE_QUESTIONS}.` };
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_PRACTICE_MIN) return { error: `Time must be 1–${MAX_PRACTICE_MIN} minutes.` };

  const ids = await pickRandom({ exam, stage, section, topics, count });
  if (!ids.length) return { error: 'No practice questions match. Try other topics.' };
  // `t` makes each Start a fresh session; a refresh keeps the same URL and resumes it.
  redirect(`/practice/run?${new URLSearchParams({ q: ids.join(','), min: String(minutes), t: String(Date.now()) })}`);
}
