import { notFound } from 'next/navigation';
import TestRunner from '@/modules/test';
import { requireUser } from '@/modules/auth/service';
import { MAX_PRACTICE_MIN } from '@/modules/test/constants';
import { getTest, toPublicTest } from '@/modules/test/service';

// /practice/run?test=&section=&min=&t= : one section as a single-section test, timed by the student.
export default async function Page({ searchParams }) {
  await requireUser();
  const q = await searchParams;
  const test = await getTest(q.test);
  const section = test?.sections.find((x) => x.id === q.section);
  const minutes = Number(q.min);
  if (!section?.questions.length || !Number.isInteger(minutes) || minutes < 1 || minutes > MAX_PRACTICE_MIN) notFound();
  const single = toPublicTest({ ...test, sections: [{ ...section, durationMin: minutes }] });
  return <TestRunner test={single} practice={{ sectionId: section.id, minutes, startedAt: String(q.t ?? '') }} />;
}
