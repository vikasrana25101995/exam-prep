'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, setUserActive } from '@/modules/auth/service';
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
