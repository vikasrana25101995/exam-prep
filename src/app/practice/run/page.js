import { notFound } from 'next/navigation';
import TestRunner from '@/modules/test';
import { requireUser } from '@/modules/auth/service';
import { MAX_PRACTICE_QUESTIONS } from '@/modules/practice/constants';
import { practiceTest } from '@/modules/practice/service';
import { MAX_PRACTICE_MIN } from '@/modules/test/constants';
import { toPublicTest } from '@/modules/test/service';

// /practice/run?q=<question ids>&min=&t= : a random set from the practice bank, timed by the student.
export default async function Page({ searchParams }) {
  await requireUser();
  const sp = await searchParams;
  const ids = String(sp.q ?? '').split(',').filter(Boolean).slice(0, MAX_PRACTICE_QUESTIONS);
  const minutes = Number(sp.min);
  if (!ids.length || !Number.isInteger(minutes) || minutes < 1 || minutes > MAX_PRACTICE_MIN) notFound();
  const test = await practiceTest(ids, minutes);
  if (!test) notFound();
  return <TestRunner test={toPublicTest({ ...test, id: 'practice' })} practice={{ minutes, startedAt: String(sp.t ?? '') }} />;
}
