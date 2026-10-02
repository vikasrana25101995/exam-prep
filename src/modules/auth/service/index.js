import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin, supabaseServer } from '@/lib/supabase';
import { REMEMBER_COOKIE } from '@/lib/session-cookie';

// Logins live in Supabase Auth; role/name/active live in public.profiles (one row per auth user,
// created by the on_auth_user_created trigger). Profiles are read with the secret key.
const INACTIVE = 'This account has been deactivated. Contact your admin.';
const BAN = '876000h'; // ~100 years: Supabase's way of blocking a login
const profiles = () => supabaseAdmin().from('profiles');
const publicUser = (p) => p && { id: p.id, name: p.name, email: p.email, role: p.role, active: p.active, createdAt: p.created_at };

async function getProfile(id) {
  const { data, error } = await profiles().select().eq('id', id).maybeSingle();
  if (error) throw error;
  return publicUser(data);
}

async function profileCount() {
  const { count, error } = await profiles().select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count;
}

// byAdmin: an admin adding a student. Otherwise it's public sign-up, which only
// works on a fresh install (the first account becomes the admin).
export async function createUser({ email, password, byAdmin = false }) {
  const count = await profileCount();
  if (!byAdmin && count > 0) return { error: 'Sign-up is closed. Ask your admin for an account.' };
  const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { error: error.code === 'email_exists' ? 'An account with this email already exists.' : error.message };
  if (count === 0) await profiles().update({ role: 'admin' }).eq('id', data.user.id);
  return { user: await getProfile(data.user.id) };
}

export async function signupOpen() {
  return (await profileCount()) === 0;
}

// Sets the auth cookies on success. Returns { user } or { error }.
export async function signIn({ email, password, remember }) {
  (await cookies()).set(REMEMBER_COOKIE, remember ? '1' : '0', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    ...(remember && { maxAge: 400 * 86400 }),
  });
  const supabase = await supabaseServer(remember);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.code === 'user_banned') return { error: INACTIVE };
  if (error?.code === 'email_not_confirmed') return { error: 'This email is not confirmed yet. Ask your admin to confirm it in Supabase.' };
  if (error) return { error: 'Wrong login or password.' };
  const user = await getProfile(data.user.id);
  if (!user?.active) {
    await supabase.auth.signOut();
    return { error: user ? INACTIVE : 'This account has no profile yet. Ask your admin.' };
  }
  return { user };
}

export async function endSession() {
  await (await supabaseServer()).auth.signOut();
  (await cookies()).delete(REMEMBER_COOKIE);
}

// cache(): layouts and pages share one lookup per request.
export const getCurrentUser = cache(async () => {
  const { data } = await (await supabaseServer()).auth.getUser();
  if (!data.user) return null;
  const user = await getProfile(data.user.id);
  return user?.active ? user : null; // deactivated = logged out everywhere
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
}

export async function listUsers() {
  const { data, error } = await profiles().select().order('created_at');
  if (error) throw error;
  return data.map(publicUser);
}

export const getUser = getProfile;

// Deactivating also bans the auth user, so they can't log back in.
export async function setUserActive(id, active) {
  const { data, error } = await profiles().update({ active }).eq('id', id).select('id');
  if (error) throw error;
  if (!data.length) return false;
  const res = await supabaseAdmin().auth.admin.updateUserById(id, { ban_duration: active ? 'none' : BAN });
  if (res.error) throw res.error;
  return true;
}
