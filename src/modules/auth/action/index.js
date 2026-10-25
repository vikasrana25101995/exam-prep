'use server';
import { redirect } from 'next/navigation';
import { createUser, endSession, getCurrentUser, requireUser, sendPasswordReset, signIn, updatePassword, verifyPassword } from '../service';
import { MIN_PASSWORD } from '../constants';

export async function authAction(_prev, formData) {
  const mode = formData.get('mode') === 'signup' ? 'signup' : 'login';
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';

  if (!email || !password) return { error: 'Enter your login and password.', email };

  if (mode === 'signup') {
    if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.`, email };
    const res = await createUser({ email, password });
    if (res.error) return { error: res.error, email };
  }

  const res = await signIn({ email, password, remember: remember || mode === 'signup' });
  if (res.error) return { error: res.error, email };
  redirect('/dashboard');
}

export async function logoutAction() {
  await endSession();
  redirect('/login');
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// New password + confirmation from a form. Returns { error } or { password }.
function checkNewPassword(formData) {
  const password = String(formData.get('password') ?? '');
  if (password.length < MIN_PASSWORD) return { error: `Use at least ${MIN_PASSWORD} characters.` };
  if (password.length > 72) return { error: 'Use at most 72 characters.' };
  if (password !== String(formData.get('confirm') ?? '')) return { error: 'The two passwords don’t match.' };
  return { password };
}

// Always answers the same way, so the form can't be used to find out who has an account.
export async function requestPasswordResetAction(_prev, formData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 200) return { error: 'Enter a valid email address.', email };
  const res = await sendPasswordReset(email);
  if (res.error) return { error: res.error, email };
  return { sent: true, email };
}

// After the email link: the user is signed in with a recovery session.
export async function resetPasswordAction(_prev, formData) {
  if (!(await getCurrentUser())) return { error: 'Your reset link has expired. Request a new one.' };
  const { error, password } = checkNewPassword(formData);
  if (error) return { error };
  const res = await updatePassword(password);
  return res.error ? { error: res.error } : { done: true };
}

// Signed-in user: must know the current password.
export async function changePasswordAction(_prev, formData) {
  const user = await requireUser();
  const current = String(formData.get('current') ?? '');
  if (!current) return { error: 'Enter your current password.' };
  const { error, password } = checkNewPassword(formData);
  if (error) return { error };
  if (password === current) return { error: 'The new password must be different from the current one.' };
  if (!(await verifyPassword(user.email, current))) return { error: 'Your current password is wrong.' };
  const res = await updatePassword(password);
  return res.error ? { error: res.error } : { done: true };
}
