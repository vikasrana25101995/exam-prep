import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/modules/auth/service';

export default async function Home() {
  redirect((await getCurrentUser()) ? '/dashboard' : '/login');
}
