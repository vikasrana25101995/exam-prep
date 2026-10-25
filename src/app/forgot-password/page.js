import { ForgotPassword } from '@/modules/auth/PasswordPages';

export default async function Page({ searchParams }) {
  return <ForgotPassword expired={(await searchParams).expired === '1'} />;
}
