// Shared by proxy.js and lib/supabase.js, so no 'server-only' here.
export const REMEMBER_COOKIE = 'remember';

// Without "Keep me logged in", auth cookies last until the browser closes.
// Deletions (empty value, maxAge 0) pass through untouched.
export const sessionCookie = (value, options, remember) =>
  remember || !value ? options : { ...options, maxAge: undefined, expires: undefined };
