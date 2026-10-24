import { unzipSync } from 'fflate';
import Papa from 'papaparse';
import readExcelFile from 'read-excel-file/node';
import { IMPORT_EXTS, MAX_OPTIONS, MAX_UNZIPPED_BYTES, MAX_ZIP_FILES, TEMPLATES } from '../constants/index.js';

// Turns uploaded files into plain questions: { section, topic, text, options[5], answer (0-based, -1 if unreadable) }.
// PDFs are read by Claude elsewhere (ai.js); everything here is plain parsing.

const extOf = (name) => name.split('.').pop().toLowerCase();
const baseName = (name) => name.split('/').pop().replace(/\.[^.]+$/, '');
const LETTERS = 'ABCDE';

// A .zip expands to its supported files; anything else is returned as-is.
export function unpack(name, bytes) {
  if (extOf(name) !== 'zip') return [{ name, ext: extOf(name), bytes }];
  let count = 0;
  let total = 0;
  const entries = unzipSync(bytes, {
    filter: (f) => {
      const file = f.name.split('/').pop();
      if (f.name.endsWith('/') || f.name.startsWith('__MACOSX/') || file.startsWith('.')) return false;
      if (++count > MAX_ZIP_FILES) throw new Error(`ZIP has more than ${MAX_ZIP_FILES} files.`);
      total += f.originalSize;
      if (total > MAX_UNZIPPED_BYTES) throw new Error(`ZIP unpacks to more than ${MAX_UNZIPPED_BYTES / 1024 / 1024}MB.`);
      return true;
    },
  });
  return Object.entries(entries).map(([entry, data]) => ({ name: entry.split('/').pop(), ext: extOf(entry), bytes: data }));
}

export const isSupported = (file) => IMPORT_EXTS.includes(file.ext);

// Header aliases, compared lowercase with spaces/underscores/dots removed.
const COLUMNS = {
  section: ['section', 'subject'],
  topic: ['topic', 'chapter'],
  text: ['question', 'questiontext', 'text'],
  answer: ['answer', 'ans', 'correct', 'correctanswer', 'correctoption', 'key'],
  minutes: ['minutes', 'time', 'duration', 'durationmin'],
  title: ['title', 'testtitle', 'testname'],
};
LETTERS.split('').forEach((l, i) => { COLUMNS[`opt${i}`] = [l.toLowerCase(), `option${l.toLowerCase()}`, `opt${l.toLowerCase()}`, `option${i + 1}`, `opt${i + 1}`]; });
const norm = (v) => String(v ?? '').toLowerCase().replace(/[\s_.\-()]/g, '');
const cell = (v) => (v === null || v === undefined ? '' : String(v).trim());

// Spreadsheet answers: a letter (A–E) or a 1-based number (1–5). Returns 0-based, or -1.
export function sheetAnswer(v) {
  const s = cell(v).toUpperCase().replace(/^OPTION\s*/, '');
  if (/^[A-E]$/.test(s)) return LETTERS.indexOf(s);
  if (/^[1-5]$/.test(s)) return Number(s) - 1;
  return -1;
}

// rows: arrays of cells. The header row is the first row with a "question" column.
export function rowsToQuestions(rows, defaultSection = '') {
  const headerAt = rows.findIndex((r) => r.some((c) => COLUMNS.text.includes(norm(c))));
  if (headerAt === -1) return { questions: [], errors: ['No "Question" column found. Use the template headers.'], durations: {} };
  const header = rows[headerAt].map(norm);
  const col = Object.fromEntries(Object.entries(COLUMNS).map(([k, names]) => [k, header.findIndex((h) => names.includes(h))]));
  const get = (r, k) => (col[k] === -1 ? '' : cell(r[col[k]]));

  const questions = [];
  const errors = [];
  const durations = {};
  let title = '';
  rows.slice(headerAt + 1).forEach((r, i) => {
    if (!r.some((c) => cell(c))) return; // blank row
    const section = get(r, 'section') || defaultSection;
    const answer = sheetAnswer(get(r, 'answer'));
    if (answer === -1) errors.push(`Row ${headerAt + i + 2}: answer must be A–E or 1–5.`);
    const minutes = Number(get(r, 'minutes'));
    if (section && minutes > 0 && !durations[section]) durations[section] = Math.round(minutes);
    title ||= get(r, 'title');
    questions.push({
      section,
      topic: get(r, 'topic'),
      text: get(r, 'text'),
      options: Array.from({ length: MAX_OPTIONS }, (_, o) => get(r, `opt${o}`)),
      answer,
    });
  });
  return { questions, errors, durations, title };
}

export function csvToRows(bytes) {
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
  return Papa.parse(text, { skipEmptyLines: false }).data; // keep blank lines so error row numbers match the file
}

// Every sheet is read; a sheet without a "Section" column uses the sheet name as the section.
export async function xlsxToQuestions(bytes) {
  const sheets = await readExcelFile(Buffer.from(bytes));
  const out = { questions: [], errors: [], durations: {}, title: '' };
  for (const { sheet, data } of sheets) {
    const r = rowsToQuestions(data, sheet);
    if (!r.questions.length && sheets.length > 1) continue; // e.g. an "Instructions" sheet
    out.questions.push(...r.questions);
    out.errors.push(...r.errors.map((e) => `${sheet}: ${e}`));
    for (const [k, v] of Object.entries(r.durations)) out.durations[k] ??= v;
    out.title ||= r.title;
  }
  if (!out.questions.length && !out.errors.length) out.errors.push('No questions found.');
  return out;
}

// JSON: either the builder's test format { title, sections: [{ name, durationMin, questions }] }
// or a plain array of questions with a "section" field. answer: 0-based index or a letter.
export function jsonToQuestions(text) {
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8').decode(text).replace(/^﻿/, '')); } catch (e) { return { questions: [], errors: [`Not valid JSON: ${e.message}`], durations: {} }; }
  const jsonAnswer = (a) => (typeof a === 'string' ? sheetAnswer(a) : Number.isInteger(a) && a >= 0 && a < MAX_OPTIONS ? a : -1);
  const toQ = (q, section) => ({
    section: cell(q?.section) || section,
    topic: cell(q?.topic),
    text: cell(q?.text ?? q?.question),
    options: Array.from({ length: MAX_OPTIONS }, (_, i) => cell(q?.options?.[i])),
    answer: jsonAnswer(q?.answer),
  });
  if (Array.isArray(data)) return { questions: data.map((q) => toQ(q, '')), errors: [], durations: {} };
  if (!Array.isArray(data?.sections)) return { questions: [], errors: ['JSON needs a "sections" array, or be an array of questions.'], durations: {} };
  const durations = {};
  const questions = data.sections.flatMap((s) => {
    const name = cell(s?.name);
    if (name && Number(s?.durationMin) > 0) durations[name] = Math.round(Number(s.durationMin));
    return (s?.questions ?? []).map((q) => toQ(q, name));
  });
  return {
    questions, errors: [], durations, title: cell(data.title),
    ...(Number.isFinite(Number(data.negativeMark)) && data.negativeMark !== undefined && { negativeMark: Number(data.negativeMark) }),
  };
}

// Groups questions into a test draft for validateTest. Section order follows first appearance.
// Minutes: from the file, else the exam template (scaled to the question count), else ~0.6–1 min per question.
export function questionsToTest(parsed, { name, exam, stage, negativeMark }) {
  const order = [];
  const bySection = {};
  for (const q of parsed.questions) {
    const s = q.section || 'Section 1';
    if (!bySection[s]) { bySection[s] = []; order.push(s); }
    bySection[s].push(q);
  }
  const template = TEMPLATES[exam]?.[stage] ?? [];
  const minutesFor = (s, n) => {
    if (parsed.durations?.[s]) return parsed.durations[s];
    const t = template.find((x) => x.name.toLowerCase() === s.toLowerCase());
    if (t) return Math.max(1, Math.round((t.durationMin * n) / t.count));
    return Math.max(1, Math.round(n * (stage === 'mains' ? 1 : 0.6)));
  };
  return {
    title: parsed.title || baseName(name),
    exam,
    stage,
    negativeMark: parsed.negativeMark ?? negativeMark,
    sections: order.map((s) => ({ name: s, durationMin: minutesFor(s, bySection[s].length), questions: bySection[s] })),
  };
}

export { baseName };
