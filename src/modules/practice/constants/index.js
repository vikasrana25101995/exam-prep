export const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
export const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(2));
// ponytail: dates shown in IST; take the viewer's zone from the browser if students go global.
export const day = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
