import { redirect } from 'next/navigation';
import { confirmEmailLink } from '@/modules/auth/service';

const TYPES = ['recovery'];

// Landing URL for Supabase email links. Signs the user in, then goes to `next`.
// ?code=… (default email template) or ?token_hash=…&type=recovery (recommended template).
export async function GET(request) {
  const url = request.nextUrl;
  const next = url.searchParams.get('next') ?? '/reset-password';
  // Same-site paths only, so the link can't bounce users to another site.
  const safeNext = next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/reset-password';
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  const code = url.searchParams.get('code');

  const ok = (tokenHash && TYPES.includes(type)) || code;
  const res = ok ? await confirmEmailLink({ code, tokenHash, type }) : { error: 'missing' };
  redirect(res.error ? '/forgot-password?expired=1' : safeNext);
}
