'use server';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createUser, requireAdmin, setUserActive } from '@/modules/auth/service';
import { deleteTest, saveTest, updateTest } from '@/modules/test/service';
import { assembleGenerated, validateGenerateOptions, validateTest } from '../service';
import { generateQuestions } from '../service/ai';

const refresh = () => ['/admin', '/tests', '/dashboard'].forEach((p) => revalidatePath(p));

// testId null = create. Returns { errors } on bad input, otherwise redirects to the admin dashboard.
export async function saveTestAction(testId, input) {
  await requireAdmin();
  const { errors, test } = validateTest(input);
  if (errors) return { errors };
  if (testId) {
    if (!(await updateTest(testId, test))) return { errors: ['This test no longer exists.'] };
  } else {
    await saveTest(test);
  }
  refresh();
  redirect('/admin');
}

export async function deleteTestAction(testId) {
  await requireAdmin();
  await deleteTest(testId);
  refresh();
}

// Drafts a paper with Claude and returns it as builder state; nothing is saved until the admin publishes.
export async function generateTestAction(input) {
  await requireAdmin();
  const { errors, opts } = validateGenerateOptions(input);
  if (errors) return { errors };
  try {
    return { test: assembleGenerated(opts, await generateQuestions(opts)) };
  } catch (e) {
    console.error('AI generation failed', e);
    return { errors: [e instanceof SyntaxError ? 'Claude returned malformed JSON. Try again.' : e.message] };
  }
}

export async function setUserActiveAction(userId, active) {
  const admin = await requireAdmin();
  if (userId === admin.id) return { error: "You can't deactivate your own account." };
  if (!(await setUserActive(userId, Boolean(active)))) return { error: 'User not found.' };
  revalidatePath('/admin/users');
  revalidatePath(`/admin/users/${userId}`);
  return {};
}

// Creates a student with a generated password. The password is returned once so the
// admin can pass it on; only its hash is stored.
export async function addStudentAction(_prev, formData) {
  await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: 'Enter a valid email address.' };
  const password = randomBytes(9).toString('base64url'); // 12 characters
  const res = await createUser({ email, password, byAdmin: true });
  if (res.error) return { error: res.error };
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  return { created: { email, password } };
}
