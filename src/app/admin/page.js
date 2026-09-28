import AppShell from '@/components/Sidebar';
import AdminDashboard from '@/modules/admin';
import { buildAdminStats } from '@/modules/admin/service';
import { listUsers, requireAdmin } from '@/modules/auth/service';
import { listAllAttempts, listTests } from '@/modules/test/service';

export default async function Page() {
  const user = await requireAdmin();
  const [tests, attempts, users] = await Promise.all([listTests(), listAllAttempts(), listUsers()]);
  return (
    <AppShell user={user}>
      <AdminDashboard stats={buildAdminStats({ tests, attempts, users })} />
    </AppShell>
  );
}
