import { redirect } from 'next/navigation';
import LoginPage from '@/modules/auth';
import { getCurrentUser } from '@/modules/auth/service';

export default async function Page() {
  if (await getCurrentUser()) redirect('/dashboard');
  return <LoginPage />;
}
