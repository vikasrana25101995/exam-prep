import { notFound } from 'next/navigation';
import AppShell from '@/components/Sidebar';
import Review from '@/modules/practice/Review';
import { requireUser } from '@/modules/auth/service';
import { getPractice } from '@/modules/test/service';

export default async function Page({ params }) {
  const user = await requireUser();
  const p = await getPractice((await params).id, user.id);
  if (!p) notFound();
  return <AppShell user={user}><Review p={p} /></AppShell>;
}
