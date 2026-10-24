import 'server-only';
import { EXAMS, STAGES } from '@/constants';
import { supabaseAdmin } from '@/lib/supabase';
import { PRACTICE_NEGATIVE_MARK } from '../constants';

// Practice question bank (table practice_questions). Server only: rows include answers.
const db = () => supabaseAdmin();
const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Supabase caps each response at 1000 rows, so read in pages. build() returns a fresh query.
async function allRows(build, cap = 20000) {
  const rows = [];
  for (let from = 0; from < cap; from += 1000) {
    const page = must(await build().range(from, from + 999));
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}
const toQuestion = (r) => ({ id: r.id, exam: r.exam, stage: r.stage, section: r.section, topic: r.topic, text: r.text, options: r.options, answer: r.answer });

// Counts per exam/stage/section/topic, for the student picker and the admin filters.
// ponytail: reads every row's tags; move to a SQL view with count(*) past ~20k questions.
export async function bankSummary() {
  const rows = await allRows(() => db().from('practice_questions').select('exam, stage, section, topic').order('id'));
  const counts = {};
  for (const r of rows) {
    const k = [r.exam, r.stage, r.section, r.topic].join('\u0000');
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return Object.entries(counts).map(([k, count]) => {
    const [exam, stage, section, topic] = k.split('\u0000');
    return { exam, stage, section, topic, count };
  });
}

// Admin list: filters + text search + paging. Returns { rows, total }.
export async function listBank({ exam, stage, section, q, page = 0, size = 50 }) {
  let query = db().from('practice_questions').select('*', { count: 'exact' });
  if (exam) query = query.eq('exam', exam);
  if (stage) query = query.eq('stage', stage);
  if (section) query = query.eq('section', section);
  if (q) query = query.ilike('text', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(page * size, page * size + size - 1);
  if (error) throw error;
  return { rows: data.map(toQuestion), total: count ?? 0 };
}

export async function getBankQuestions(ids) {
  const clean = ids.filter((id) => UUID.test(id));
  if (!clean.length) return [];
  const rows = must(await db().from('practice_questions').select().in('id', clean));
  const byId = Object.fromEntries(rows.map((r) => [r.id, toQuestion(r)]));
  return clean.map((id) => byId[id]).filter(Boolean); // keep the requested order
}

export async function addBankQuestions(questions) {
  if (!questions.length) return 0;
  // Insert in chunks so one huge import doesn't hit request size limits.
  for (let i = 0; i < questions.length; i += 500) {
    must(await db().from('practice_questions').insert(questions.slice(i, i + 500)));
  }
  return questions.length;
}

export async function updateBankQuestion(id, question) {
  if (!UUID.test(id ?? '')) return false;
  const rows = must(await db().from('practice_questions').update(question).eq('id', id).select('id'));
  return rows.length > 0;
}

export async function deleteBankQuestion(id) {
  if (!UUID.test(id ?? '')) return;
  must(await db().from('practice_questions').delete().eq('id', id));
}

// Random practice set. topics empty = any topic in the section.
// ponytail: fetches matching ids and shuffles in JS; use a SQL function with ORDER BY random() past ~20k questions per section.
export async function pickRandom({ exam, stage, section, topics, count }) {
  const ids = (await allRows(() => {
    const query = db().from('practice_questions').select('id').eq('exam', exam).eq('stage', stage).eq('section', section);
    return (topics.length ? query.in('topic', topics) : query).order('id');
  })).map((r) => r.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, count);
}

// A practice set as the single-section test the runner and scoring expect. Null if none of the ids exist.
// ponytail: the set's ids travel in the URL (max 50 × 36 chars); store a draft row if sets grow past that.
export async function practiceTest(ids, minutes) {
  const questions = await getBankQuestions(ids);
  if (!questions.length) return null;
  const { exam, stage, section } = questions[0];
  return {
    id: null, // not a stored test; practice_sessions.test_id stays null
    title: `${EXAMS.find((e) => e.id === exam)?.name ?? exam} ${STAGES.find((s) => s.id === stage)?.name ?? stage} · practice`,
    exam,
    stage,
    negativeMark: PRACTICE_NEGATIVE_MARK,
    sections: [{ id: 'practice', name: section, durationMin: minutes, questions: questions.map(({ id, text, options, answer, topic }) => ({ id, text, options, answer, topic })) }],
  };
}
