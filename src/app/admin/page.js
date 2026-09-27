import AppShell from '@/components/Sidebar';
import AdminPage from '@/modules/admin';
import { requireAdmin } from '@/modules/auth/service';
import { listTests, toPublicTest } from '@/modules/test/service';

export default async function Page() {
  const user = await requireAdmin();
  const tests = (await listTests()).map(toPublicTest);
  return (
    <AppShell user={user}>
      <AdminPage tests={tests} />
    </AppShell>
  );
}
