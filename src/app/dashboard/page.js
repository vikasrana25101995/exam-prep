import AppShell from '@/components/Sidebar';
import Dashboard from '@/modules/dashboard';
import { requireUser } from '@/modules/auth/service';
import { listAttempts, listTests, toPublicTest } from '@/modules/test/service';

export default async function Page() {
  const user = await requireUser();
  const [attempts, tests] = await Promise.all([listAttempts(user.id), listTests()]);
  return (
    <AppShell user={user}>
      <Dashboard user={user} attempts={attempts} tests={tests.map(toPublicTest)} />
    </AppShell>
  );
}
