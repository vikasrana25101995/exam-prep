import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { REMEMBER_COOKIE, sessionCookie } from './session-cookie';

const env = (k) => {
  if (!process.env[k]) throw new Error(`${k} is missing. Add it to .env.local (see .env.example).`);
  return process.env[k];
};

// Acts as the logged-in user via the auth cookies. `remember` overrides the cookie during login.
export async function supabaseServer(remember) {
  const jar = await cookies();
  const keep = remember ?? jar.get(REMEMBER_COOKIE)?.value === '1';
  return createServerClient(env('SUPABASE_URL'), env('SUPABASE_PUBLISHABLE_KEY'), {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => jar.set(name, value, sessionCookie(value, options, keep)));
        } catch { /* Server Components can't set cookies; proxy.js keeps the session fresh. */ }
      },
    },
  });
}

// Secret key: bypasses RLS. Server only, never per-user.
let admin;
export const supabaseAdmin = () =>
  (admin ??= createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), { auth: { persistSession: false, autoRefreshToken: false } }));
