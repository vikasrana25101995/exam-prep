import { EXAMS, STAGES } from '../../../constants';
import { MAX_OPTIONS, MAX_SECTIONS } from '../constants';

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Validates admin input and returns a clean test (answers re-indexed after blank options are dropped).
export function validateTest(input) {
  const errors = [];
  const title = str(input?.title, 200);
  if (!title) errors.push('Give the test a title.');
  const exam = EXAMS.find((e) => e.id === input?.exam && e.live)?.id;
  if (!exam) errors.push('Pick a live exam.');
  const stage = STAGES.find((s) => s.id === input?.stage)?.id;
  if (!stage) errors.push('Pick a stage.');
  const negativeMark = Number(input?.negativeMark);
  if (!(negativeMark >= 0 && negativeMark <= 1)) errors.push('Negative marking must be between 0 and 1.');

  const rawSections = Array.isArray(input?.sections) ? input.sections : [];
  if (!rawSections.length || rawSections.length > MAX_SECTIONS) errors.push(`Add 1–${MAX_SECTIONS} sections.`);

  const sections = rawSections.slice(0, MAX_SECTIONS).map((sec, si) => {
    const where = `Section ${si + 1}`;
    const name = str(sec?.name, 100);
    if (!name) errors.push(`${where}: add a name.`);
    const durationMin = Number(sec?.durationMin);
    if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 300) errors.push(`${where}: time must be 1–300 whole minutes.`);
    const rawQs = Array.isArray(sec?.questions) ? sec.questions : [];
    if (!rawQs.length) errors.push(`${where}: add at least one question.`);

    const questions = rawQs.map((q, qi) => {
      const at = `${where}, Q${qi + 1}`;
      const text = str(q?.text, 5000);
      if (!text) errors.push(`${at}: question text is empty.`);
      const kept = (Array.isArray(q?.options) ? q.options : []).slice(0, MAX_OPTIONS)
        .map((o, i) => ({ text: str(o, 1000), i }))
        .filter((o) => o.text);
      if (kept.length < 2) errors.push(`${at}: needs at least 2 options.`);
      const answer = kept.findIndex((o) => o.i === q?.answer);
      if (answer === -1) errors.push(`${at}: the correct answer must be a filled option.`);
      return { text, options: kept.map((o) => o.text), answer, topic: str(q?.topic, 100) };
    });
    return { name, durationMin, questions };
  });

  return errors.length ? { errors } : { test: { title, exam, stage, negativeMark, sections } };
}
