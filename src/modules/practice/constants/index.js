export const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
export const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(2));
// ponytail: dates shown in IST; take the viewer's zone from the browser if students go global.
export const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
export const MAX_PRACTICE_QUESTIONS = 50;
export const DEFAULT_PRACTICE_QUESTIONS = 10;
// Suggested time per question, by stage (real papers run about 0.6 min/q prelims, 1 min/q mains).
export const suggestedMinutes = (count, stage) => Math.max(1, Math.round(count * (stage === 'mains' ? 1 : 0.6)));
export const PRACTICE_NEGATIVE_MARK = 0.25;
