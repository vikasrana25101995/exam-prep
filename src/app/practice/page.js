import AppShell from '@/components/Sidebar';
import Practice from '@/modules/practice';
import { requireUser } from '@/modules/auth/service';
import { listPractice, listTests } from '@/modules/test/service';

export default async function Page() {
  const user = await requireUser();
  const [tests, history] = await Promise.all([listTests(), listPractice(user.id)]);
  return (
    <AppShell user={user}>
      <Practice
        tests={tests
          .map((t) => ({
            id: t.id, title: t.title, exam: t.exam, stage: t.stage,
            sections: t.sections.filter((x) => x.questions.length).map((x) => ({ id: x.id, name: x.name, durationMin: x.durationMin, questions: x.questions.length })),
          }))
          .filter((t) => t.sections.length)}
        history={history}
      />
    </AppShell>
  );
}
