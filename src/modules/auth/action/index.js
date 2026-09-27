'use server';
import { redirect } from 'next/navigation';
import { createUser, endSession, startSession, verifyUser } from '../service';
import { MIN_PASSWORD } from '../constants';

export async function authAction(_prev, formData) {
  const mode = formData.get('mode') === 'signup' ? 'signup' : 'login';
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const remember = formData.get('remember') === 'on';

  if (!email || !password) return { error: 'Enter your login and password.', email };

  let user;
  if (mode === 'signup') {
    if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.`, email };
    const res = await createUser({ email, password });
    if (res.error) return { error: res.error, email };
    user = res.user;
  } else {
    user = await verifyUser({ email, password });
    if (!user) return { error: 'Wrong login or password.', email };
  }

  await startSession(user.id, remember || mode === 'signup');
  redirect('/dashboard');
}

export async function logoutAction() {
  await endSession();
  redirect('/login');
}
