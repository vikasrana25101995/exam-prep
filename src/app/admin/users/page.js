import AppShell from '@/components/Sidebar';
import StudentsList from '@/modules/admin/StudentsList';
import { buildStudentRows } from '@/modules/admin/service';
import { listUsers, requireAdmin } from '@/modules/auth/service';
import { listAllAttempts } from '@/modules/test/service';

export default async function Page() {
  const user = await requireAdmin();
  const [users, attempts] = await Promise.all([listUsers(), listAllAttempts()]);
  return (
    <AppShell user={user}>
      <StudentsList students={buildStudentRows(users, attempts)} />
    </AppShell>
  );
}
