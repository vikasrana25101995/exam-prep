'use server';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createUser, requireAdmin, setUserActive } from '@/modules/auth/service';
import { deleteTest, saveTest, updateTest } from '@/modules/test/service';
import { addBankQuestions, deleteBankQuestion, updateBankQuestion } from '@/modules/practice/service';
import { assembleGenerated, generatedToBank, validateBankQuestion, validateGenerateOptions, validateTest } from '../service';
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

// ---- Practice question bank ----

const refreshBank = () => ['/admin/practice', '/practice'].forEach((p) => revalidatePath(p));

// id null = add. Returns { errors } or { ok: true }.
export async function saveBankQuestionAction(id, input) {
  await requireAdmin();
  const { errors, question } = validateBankQuestion(input);
  if (errors) return { errors };
  if (id) {
    if (!(await updateBankQuestion(id, question))) return { errors: ['This question no longer exists.'] };
  } else {
    await addBankQuestions([question]);
  }
  refreshBank();
  return { ok: true };
}

export async function deleteBankQuestionAction(id) {
  await requireAdmin();
  await deleteBankQuestion(id);
  refreshBank();
}

// AI drafts for the practice bank: returned for review, saved only by addBankDraftsAction.
export async function generateBankAction(input) {
  await requireAdmin();
  const { errors, opts } = validateGenerateOptions(input);
  if (errors) return { errors };
  try {
    const { drafts, errors: bad } = generatedToBank(opts, await generateQuestions(opts));
    if (!drafts.length) return { errors: ['Claude returned no usable questions. Try again.', ...bad] };
    return { drafts, errors: bad };
  } catch (e) {
    console.error('AI bank generation failed', e);
    return { errors: [e.message] };
  }
}

// Re-validates on the server: drafts come back from the browser and may have been edited.
export async function addBankDraftsAction(drafts) {
  await requireAdmin();
  const list = Array.isArray(drafts) ? drafts.slice(0, 500) : [];
  const good = [];
  const errors = [];
  list.forEach((d, i) => {
    const v = validateBankQuestion(d);
    if (v.errors) errors.push(`Question ${i + 1}: ${v.errors.join(' ')}`);
    else good.push(v.question);
  });
  if (errors.length) return { errors };
  await addBankQuestions(good);
  refreshBank();
  return { added: good.length };
}
