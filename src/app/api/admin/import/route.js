import { revalidatePath } from 'next/cache';
import { EXAMS, STAGES } from '@/constants';
import { IMPORT_TARGETS, MAX_IMPORT_BYTES } from '@/modules/admin/constants';
import { runImport } from '@/modules/admin/service/import-run';
import { getCurrentUser } from '@/modules/auth/service';

// Multipart upload: files[] + target, exam, stage, negativeMark. A route handler rather than a
// server action because uploads can be far bigger than the 1MB server-action limit.
export async function POST(request) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_IMPORT_BYTES + 1024 * 1024) {
    return Response.json({ error: `Upload is larger than ${MAX_IMPORT_BYTES / 1024 / 1024}MB.` }, { status: 413 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Could not read the upload.' }, { status: 400 });
  }
  const target = IMPORT_TARGETS.find((t) => t.id === form.get('target'))?.id;
  const exam = EXAMS.find((e) => e.id === form.get('exam') && e.live)?.id;
  const stage = STAGES.find((s) => s.id === form.get('stage'))?.id;
  const negativeMark = Number(form.get('negativeMark') ?? 0.25);
  const files = form.getAll('files').filter((f) => typeof f === 'object' && f.size > 0);
  if (!target || !exam || !stage) return Response.json({ error: 'Pick what to import into, the exam and the stage.' }, { status: 400 });
  if (!(negativeMark >= 0 && negativeMark <= 1)) return Response.json({ error: 'Negative marking must be between 0 and 1.' }, { status: 400 });
  if (!files.length) return Response.json({ error: 'Choose at least one file.' }, { status: 400 });
  if (files.reduce((a, f) => a + f.size, 0) > MAX_IMPORT_BYTES) {
    return Response.json({ error: `Upload is larger than ${MAX_IMPORT_BYTES / 1024 / 1024}MB.` }, { status: 413 });
  }

  const uploads = await Promise.all(files.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
  const results = await runImport(uploads, { target, exam, stage, negativeMark });
  ['/admin', '/admin/practice', '/tests', '/dashboard', '/practice'].forEach((p) => revalidatePath(p));
  return Response.json({ results });
}
