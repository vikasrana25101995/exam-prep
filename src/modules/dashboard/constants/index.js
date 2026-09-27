export const TREND_POINTS = 6;
export const RECENT_ROWS = 5;
export const WORK_ON_COUNT = 3;

export const BANDS = [
  { min: 80, key: 'high', label: '80% and above' },
  { min: 65, key: 'mid', label: '65–79%' },
  { min: 0, key: 'low', label: 'Below 65% — practise' },
];
export const band = (pct) => BANDS.find((b) => pct >= b.min).key;

export const TAGS = { top: 'Strongest', mid: 'Steady', low: 'Needs work' };

const SHORT = { 'Quantitative Aptitude': 'Quant', 'English Language': 'English', 'Reasoning Ability': 'Reasoning' };
export const shortName = (name) => SHORT[name] ?? name.split(' ')[0];

// Shown (with a "Sample data" badge) until the user has taken a mock.
const sec = (name, max, correct, wrong) => ({ name, max, correct, wrong, attempted: correct + wrong, score: correct - wrong * 0.25 });
const mock = (i, e, q, r, topics = []) => {
  const sections = [sec('English Language', 30, ...e), sec('Quantitative Aptitude', 35, ...q), sec('Reasoning Ability', 35, ...r)];
  return { id: `sample-${i}`, submittedAt: `2026-0${i}-01`, sections, topics, max: 100, total: sections.reduce((a, s) => a + s.score, 0) };
};
const t = (section, topic, correct, attempted) => ({ section, topic, correct, attempted });

export const SAMPLE_ATTEMPTS = [
  mock(1, [20, 4], [15, 6], [27, 5]),
  mock(2, [21, 4], [17, 6], [28, 4]),
  mock(3, [21, 5], [17, 5], [27, 3]),
  mock(4, [22, 4], [19, 6], [26, 2]),
  mock(5, [23, 5], [21, 8], [27, 2]),
  mock(6, [23, 3], [22, 9], [28, 2], [
    t('Quantitative Aptitude', 'Data Interpretation', 26, 50),
    t('Quantitative Aptitude', 'Arithmetic word problems', 22, 40),
    t('Quantitative Aptitude', 'Number series', 37, 50),
    t('Quantitative Aptitude', 'Quadratic equations', 39, 50),
    t('Quantitative Aptitude', 'Simplification', 41, 50),
    t('English Language', 'Error spotting', 32, 50),
    t('English Language', 'Reading comprehension', 45, 60),
    t('English Language', 'Para jumbles', 42, 48),
    t('English Language', 'Fill in the blanks', 40, 46),
    t('Reasoning Ability', 'Puzzles', 40, 52),
    t('Reasoning Ability', 'Syllogism', 30, 32),
    t('Reasoning Ability', 'Inequality', 28, 30),
    t('Reasoning Ability', 'Blood relations', 25, 28),
  ]),
];
