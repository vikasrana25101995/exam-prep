import { notFound } from 'next/navigation';
import AppShell from '@/components/Sidebar';
import TestBuilder from '@/modules/admin/TestBuilder';
import { requireAdmin } from '@/modules/auth/service';
import { getTest } from '@/modules/test/service';

// Admin-only, so the full test (with answers) is sent to the builder.
export default async function Page({ params }) {
  const user = await requireAdmin();
  const test = await getTest((await params).id);
  if (!test) notFound();
  return (
    <AppShell user={user}>
      <TestBuilder initial={test} testId={test.id} />
    </AppShell>
  );
}
