'use server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/modules/auth/service';
import { saveTest } from '@/modules/test/service';
import { validateTest } from '../service';

export async function createTestAction(input) {
  await requireAdmin();
  const { errors, test } = validateTest(input);
  if (errors) return { errors };
  const saved = await saveTest(test);
  revalidatePath('/tests');
  revalidatePath('/admin');
  return { id: saved.id, title: saved.title };
}
