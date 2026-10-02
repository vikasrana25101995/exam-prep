'use client';
import { useState } from 'react';
import Link from 'next/link';
import { EXAMS, examName, stageName } from '@/constants';
import s from './style/index.module.scss';

const PAGE_SIZE = 9;

// tests: slim rows from the page (no questions or answers reach the browser).
export default function TestsList({ tests, taken }) {
  const [q, setQ] = useState('');
  const [exam, setExam] = useState('');
  const [page, setPage] = useState(0);
  const takenSet = new Set(taken);
  const needle = q.trim().toLowerCase();
  const matches = tests.filter((t) => (!exam || t.exam === exam) && (!needle || t.title.toLowerCase().includes(needle)));
  const pages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const p = Math.min(page, pages - 1);
  const shown = matches.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);

  return (
    <main className={s.page}>
      <header className={s.head}><div><p className={s.kicker}>Take a test</p><h1>Available mocks</h1></div></header>
      {tests.length === 0 ? <p className={s.info}>No tests yet. Ask an admin to create one.</p> : (
        <div className={s.filters}>
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search tests" aria-label="Search tests" />
          <select value={exam} onChange={(e) => { setExam(e.target.value); setPage(0); }} aria-label="Category">
            <option value="">All categories</option>
            {EXAMS.filter((e) => e.live).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      )}
      {tests.length > 0 && matches.length === 0 && <p className={s.info}>No tests match your search.</p>}
      <div className={s.testGrid}>
        {shown.map((t) => (
          <section key={t.id} className={`${s.card} ${s.testCard}`}>
            <p className={s.label}>{examName(t.exam)} · {stageName(t.stage)}</p>
            <h3>{t.title}</h3>
            <p className={s.info}>{t.questions} questions · {t.minutes} minutes · {t.sections} sections</p>
            <Link href={`/test/${t.id}`} className={s.startBtn}>{takenSet.has(t.id) ? 'Retake' : 'Start'}</Link>
          </section>
        ))}
      </div>
      {pages > 1 && (
        <nav className={s.pager} aria-label="Test pages">
          <button type="button" disabled={p === 0} onClick={() => { setPage(p - 1); window.scrollTo(0, 0); }}>Previous</button>
          <span className={s.info}>Page {p + 1} of {pages}</span>
          <button type="button" disabled={p >= pages - 1} onClick={() => { setPage(p + 1); window.scrollTo(0, 0); }}>Next</button>
        </nav>
      )}
    </main>
  );
}
