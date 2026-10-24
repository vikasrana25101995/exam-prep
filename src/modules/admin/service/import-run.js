import 'server-only';
import { addBankQuestions } from '@/modules/practice/service';
import { saveTest } from '@/modules/test/service';
import { MAX_IMPORT_PDFS, TEMPLATES } from '../constants';
import { extractPdfQuestions } from './ai';
import { validateBankQuestion, validateTest } from './index';
import { csvToRows, isSupported, jsonToQuestions, questionsToTest, rowsToQuestions, unpack, xlsxToQuestions } from './importer';

const MAX_SHOWN_ERRORS = 15;
const trim = (errors) => (errors.length > MAX_SHOWN_ERRORS ? [...errors.slice(0, MAX_SHOWN_ERRORS), `…and ${errors.length - MAX_SHOWN_ERRORS} more`] : errors);

async function parse(file, opts) {
  if (file.ext === 'csv') return rowsToQuestions(csvToRows(file.bytes));
  if (file.ext === 'xlsx') return xlsxToQuestions(file.bytes);
  if (file.ext === 'json') return jsonToQuestions(file.bytes);
  // pdf
  const sections = (TEMPLATES[opts.exam]?.[opts.stage] ?? []).map((t) => t.name);
  const out = await extractPdfQuestions(file.bytes, { ...opts, sections });
  return {
    questions: (out.sections ?? []).flatMap((s) => (s.questions ?? []).map((q) => ({
      section: s.name, topic: q.topic ?? '', text: q.text ?? '', options: q.options ?? [], answer: q.answer,
    }))),
    errors: [],
    durations: {},
  };
}

// uploads: [{ name, bytes }]. opts: { target: 'mock' | 'practice', exam, stage, negativeMark } (already validated).
// Returns one result per file: { file, ok, message, errors[], testId? }.
export async function runImport(uploads, opts) {
  const results = [];
  const files = [];
  for (const u of uploads) {
    try {
      files.push(...unpack(u.name, u.bytes));
    } catch (e) {
      results.push({ file: u.name, ok: false, message: 'Could not open this file.', errors: [e.message] });
    }
  }

  let pdfs = 0;
  for (const file of files) {
    if (!isSupported(file)) {
      results.push({ file: file.name, ok: false, message: 'Skipped: only .xlsx, .csv, .json and .pdf files are imported.', errors: [] });
      continue;
    }
    if (file.ext === 'pdf' && ++pdfs > MAX_IMPORT_PDFS) {
      results.push({ file: file.name, ok: false, message: `Skipped: at most ${MAX_IMPORT_PDFS} PDFs per upload.`, errors: [] });
      continue;
    }
    try {
      const parsed = await parse(file, opts);
      results.push(opts.target === 'mock' ? await importMock(file, parsed, opts) : await importPractice(file, parsed, opts));
    } catch (e) {
      console.error('Import failed for', file.name, e);
      results.push({ file: file.name, ok: false, message: 'Import failed.', errors: [e.message] });
    }
  }
  return results;
}

// A file is one mock test, saved only if the whole test is valid.
async function importMock(file, parsed, opts) {
  if (!parsed.questions.length) return { file: file.name, ok: false, message: 'No questions found.', errors: trim(parsed.errors) };
  const { errors, test } = validateTest(questionsToTest(parsed, { name: file.name, ...opts }));
  if (errors) return { file: file.name, ok: false, message: 'Not imported: fix these and upload again.', errors: trim([...parsed.errors, ...errors]) };
  const saved = await saveTest(test);
  const n = test.sections.reduce((a, s) => a + s.questions.length, 0);
  return { file: file.name, ok: true, message: `Created mock test “${test.title}” (${n} questions, ${test.sections.length} sections).`, errors: [], testId: saved.id };
}

// Good questions go into the bank; bad ones are reported and skipped.
async function importPractice(file, parsed, opts) {
  const good = [];
  const errors = [...parsed.errors];
  parsed.questions.forEach((q, i) => {
    const v = validateBankQuestion({ ...q, exam: opts.exam, stage: opts.stage });
    if (v.errors) errors.push(`Question ${i + 1}: ${v.errors.join(' ')}`);
    else good.push(v.question);
  });
  if (!good.length) return { file: file.name, ok: false, message: 'No valid questions to add.', errors: trim(errors) };
  await addBankQuestions(good);
  const skipped = parsed.questions.length - good.length;
  return {
    file: file.name,
    ok: true,
    message: `Added ${good.length} practice question${good.length === 1 ? '' : 's'}${skipped ? `, skipped ${skipped}` : ''}.`,
    errors: trim(errors),
  };
}
