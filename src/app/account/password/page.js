import AppShell from '@/components/Sidebar';
import { ChangePassword } from '@/modules/auth/PasswordPages';
import { requireUser } from '@/modules/auth/service';

export default async function Page() {
  const user = await requireUser();
  return (
    <AppShell user={user}>
      <ChangePassword />
    </AppShell>
  );
}
