import { notFound } from 'next/navigation';
import AppShell from '@/components/Sidebar';
import StudentDetail from '@/modules/admin/StudentDetail';
import { buildStudentDetail } from '@/modules/admin/service';
import { getUser, requireAdmin } from '@/modules/auth/service';
import { listAttempts } from '@/modules/test/service';

export default async function Page({ params }) {
  const user = await requireAdmin();
  const student = await getUser((await params).id);
  if (!student) notFound();
  return (
    <AppShell user={user}>
      <StudentDetail student={student} groups={buildStudentDetail(await listAttempts(student.id))} />
    </AppShell>
  );
}
