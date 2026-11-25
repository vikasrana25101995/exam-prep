import { notFound } from 'next/navigation';
import AppShell from '@/components/Sidebar';
import Review from '@/modules/test/Review';
import { requireUser } from '@/modules/auth/service';
import { getAttempt } from '@/modules/test/service';

export default async function Page({ params }) {
  const user = await requireUser();
  const a = await getAttempt((await params).id, user.id);
  if (!a) notFound();
  return <AppShell user={user}><Review a={a} /></AppShell>;
}
