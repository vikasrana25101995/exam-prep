import AppShell from '@/components/Sidebar';
import TestsList from '@/modules/dashboard/TestsList';
import { requireUser } from '@/modules/auth/service';
import { listAttempts, listTests } from '@/modules/test/service';

export default async function Page() {
  const user = await requireUser();
  const [attempts, tests] = await Promise.all([listAttempts(user.id), listTests()]);
  return (
    <AppShell user={user}>
      <TestsList
        tests={tests.map((t) => ({
          id: t.id, title: t.title, exam: t.exam, stage: t.stage, sections: t.sections.length,
          questions: t.sections.reduce((a, x) => a + x.questions.length, 0),
          minutes: t.sections.reduce((a, x) => a + x.durationMin, 0),
        }))}
        taken={attempts.map((a) => a.testId)}
      />
    </AppShell>
  );
}
