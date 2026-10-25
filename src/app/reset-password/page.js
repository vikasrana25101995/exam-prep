import { ResetPassword } from '@/modules/auth/PasswordPages';
import { getCurrentUser } from '@/modules/auth/service';

// Reached from the email link via /auth/confirm, which signs the user in first.
export default async function Page() {
  return <ResetPassword valid={!!(await getCurrentUser())} />;
}
