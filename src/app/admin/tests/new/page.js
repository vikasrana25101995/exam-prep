import AppShell from '@/components/Sidebar';
import TestBuilder from '@/modules/admin/TestBuilder';
import { requireAdmin } from '@/modules/auth/service';

export default async function Page() {
  const user = await requireAdmin();
  return (
    <AppShell user={user}>
      <TestBuilder />
    </AppShell>
  );
}
