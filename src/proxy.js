import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { REMEMBER_COOKIE, sessionCookie } from './lib/session-cookie';

// Refreshes the Supabase session on each request and writes rotated tokens back,
// since Server Components can't set cookies themselves.
export async function proxy(request) {
  let response = NextResponse.next({ request });
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) return response; // pages then throw a clear "X is missing" error
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value === '1';
  const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list, headers) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionCookie(value, options, remember)));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
