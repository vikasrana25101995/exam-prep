import AppShell from '@/components/Sidebar';
import { EXAMS } from '@/constants';
import Practice from '@/modules/practice';
import { requireUser } from '@/modules/auth/service';
import { bankSummary } from '@/modules/practice/service';
import { listPractice } from '@/modules/test/service';

export default async function Page() {
  const user = await requireUser();
  const [summary, history] = await Promise.all([bankSummary(), listPractice(user.id)]);
  const live = new Set(EXAMS.filter((e) => e.live).map((e) => e.id));
  return (
    <AppShell user={user}>
      <Practice summary={summary.filter((r) => live.has(r.exam))} history={history} />
    </AppShell>
  );
}
