import { redirect } from 'next/navigation';
import LoginPage from '@/modules/auth';
import { getCurrentUser, signupOpen } from '@/modules/auth/service';

export default async function Page() {
  if (await getCurrentUser()) redirect('/dashboard');
  // Sign-up only shows on a fresh install, to create the first admin.
  return <LoginPage allowSignup={await signupOpen()} />;
}
