'use client';
import { useState } from 'react';
import s from './style/index.module.scss';

// columns: [{ key, label, value: (row) => sortable/searchable value, render?: (row) => node }]
export default function DataTable({ columns, rows, pageSize = 10, empty = 'No rows.' }) {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ i: -1, dir: 1 });
  const [page, setPage] = useState(0);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((r) => columns.some((c) => String(c.value(r) ?? '').toLowerCase().includes(needle)))
    : rows;
  const sorted = sort.i < 0 ? filtered : filtered.toSorted((a, b) => {
    const x = columns[sort.i].value(a), y = columns[sort.i].value(b);
    if (x === y) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x > y ? 1 : -1) * sort.dir;
  });
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const p = Math.min(page, pages - 1);
  const shown = sorted.slice(p * pageSize, (p + 1) * pageSize);

  const toggleSort = (i) => setSort((cur) => ({ i, dir: cur.i === i ? -cur.dir : 1 }));

  return (
    <div>
      <div className={s.dtTop}>
        <input
          type="search" value={q} placeholder="Search…" aria-label="Search table" className={s.input}
          onChange={(e) => { setQ(e.target.value); setPage(0); }}
        />
        <span className={s.muted}>{sorted.length} of {rows.length}</span>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              {columns.map((c, i) => (
                <th key={c.key} aria-sort={sort.i === i ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" className={s.sortBtn} onClick={() => toggleSort(i)}>
                    {c.label}{sort.i === i ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0
              ? <tr><td colSpan={columns.length} className={s.muted}>{empty}</td></tr>
              : shown.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.key}>{c.render ? c.render(r) : c.value(r)}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className={s.dtPager}>
          <button type="button" className={s.secondary} disabled={p === 0} onClick={() => setPage(p - 1)}>Previous</button>
          <span className={s.muted}>Page {p + 1} of {pages}</span>
          <button type="button" className={s.secondary} disabled={p >= pages - 1} onClick={() => setPage(p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
