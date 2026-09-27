import AppShell from '@/components/Sidebar';
import TestsList from '@/modules/dashboard/TestsList';
import { requireUser } from '@/modules/auth/service';
import { listAttempts, listTests } from '@/modules/test/service';

export default async function Page() {
  const user = await requireUser();
  const [attempts, tests] = await Promise.all([listAttempts(user.id), listTests()]);
  return (
    <AppShell user={user}>
      <TestsList tests={tests} attempts={attempts} />
    </AppShell>
  );
}
