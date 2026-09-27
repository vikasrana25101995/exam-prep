import { notFound } from 'next/navigation';
import TestRunner from '@/modules/test';
import { requireUser } from '@/modules/auth/service';
import { getTest, toPublicTest } from '@/modules/test/service';

export default async function Page({ params }) {
  await requireUser();
  const test = await getTest((await params).id);
  if (!test) notFound();
  return <TestRunner test={toPublicTest(test)} />;
}
