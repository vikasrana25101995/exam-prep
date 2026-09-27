import { RECENT_ROWS, TAGS, TREND_POINTS, WORK_ON_COUNT, shortName } from '../constants';

const pct = (c, a) => (a ? Math.round((c / a) * 100) : 0);
const sum = (xs, f) => xs.reduce((acc, x) => acc + f(x), 0);
export const fmt = (n) => n.toFixed(2);
export const signed = (n) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;

// attempts: oldest first. Pure so it runs on server or client.
export function buildDashboard(attempts) {
  if (!attempts.length) return null;
  const n = attempts.length;
  const latest = attempts[n - 1];
  const numbered = attempts.map((a, i) => ({ ...a, mockNo: i + 1 }));

  // Topics, aggregated across all mocks.
  const topicMap = {};
  for (const a of attempts) for (const t of a.topics ?? []) {
    const k = `${t.section}|${t.topic}`;
    topicMap[k] ??= { section: t.section, topic: t.topic, correct: 0, attempted: 0 };
    topicMap[k].correct += t.correct;
    topicMap[k].attempted += t.attempted;
  }
  const topics = Object.values(topicMap)
    .map((t) => ({ ...t, accuracy: pct(t.correct, t.attempted) }))
    .sort((a, b) => a.accuracy - b.accuracy);

  // Sections, keyed by name so tests with the same sections line up.
  const sections = latest.sections.map(({ name, max }) => {
    const rows = attempts.map((a) => a.sections.find((s) => s.name === name)).filter(Boolean);
    const own = topics.filter((t) => t.section === name);
    const change = rows.length > 1 ? rows.at(-1).score - rows[0].score : 0;
    const note = [
      own.length && `Best: ${own.at(-1).topic} (${own.at(-1).accuracy}%).`,
      own.length > 1 && `Weakest: ${own[0].topic} (${own[0].accuracy}%).`,
      rows.length > 1 && `${signed(change)} since Mock 1.`,
    ].filter(Boolean).join(' ');
    return {
      name,
      max,
      avg: sum(rows, (r) => r.score) / rows.length,
      accuracy: pct(sum(rows, (r) => r.correct), sum(rows, (r) => r.attempted)),
      note,
    };
  });
  const byAcc = [...sections].sort((a, b) => b.accuracy - a.accuracy);
  for (const s of sections) {
    s.tag = s === byAcc[0] ? 'top' : s === byAcc.at(-1) && sections.length > 1 ? 'low' : 'mid';
    s.tagLabel = TAGS[s.tag];
  }

  return {
    latest: { mockNo: n, total: latest.total, max: latest.max, delta: n > 1 ? latest.total - attempts[n - 2].total : null },
    average: sum(attempts, (a) => a.total) / n,
    count: n,
    trend: numbered.slice(-TREND_POINTS).map((a) => ({ label: `M${a.mockNo}`, total: a.total })),
    sections: byAcc, // strongest first, like the design
    topicSections: sections.map((s) => s.name).filter((name) => topics.some((t) => t.section === name)),
    topics,
    workOn: topics.slice(0, WORK_ON_COUNT).map((t) => ({ ...t, short: shortName(t.section) })),
    columns: latest.sections.map((s) => ({ name: s.name, short: shortName(s.name), max: s.max })),
    recent: numbered.slice().reverse().map((a) => ({
      id: a.id,
      mockNo: a.mockNo,
      scores: latest.sections.map((c) => a.sections.find((s) => s.name === c.name)?.score ?? null),
      total: a.total,
      max: a.max,
    })),
    recentRows: RECENT_ROWS,
  };
}
