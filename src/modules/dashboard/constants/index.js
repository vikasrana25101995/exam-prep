export const TREND_POINTS = 6;
export const RECENT_ROWS = 5;
export const WORK_ON_COUNT = 3;

export const BANDS = [
  { min: 80, key: 'high', label: '80% and above' },
  { min: 65, key: 'mid', label: '65–79%' },
  { min: 0, key: 'low', label: 'Below 65% — practise' },
];
export const band = (pct) => BANDS.find((b) => pct >= b.min).key;

export const TAGS = { top: 'Strongest', mid: 'Steady', low: 'Needs work', none: 'Not attempted' };

const SHORT = { 'Quantitative Aptitude': 'Quant', 'English Language': 'English', 'Reasoning Ability': 'Reasoning' };
export const shortName = (name) => SHORT[name] ?? name.split(' ')[0];
