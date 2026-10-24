import AppShell from '@/components/Sidebar';
import ImportPage from '@/modules/admin/ImportPage';
import { requireAdmin } from '@/modules/auth/service';

export default async function Page() {
  const user = await requireAdmin();
  return (
    <AppShell user={user}>
      <ImportPage />
    </AppShell>
  );
}
