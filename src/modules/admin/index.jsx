'use client';
import Link from 'next/link';
import { examName, stageName } from '@/constants';
import { useDeleteTest } from './hooks';
import s from './style/index.module.scss';

const pct = (n) => (n === null ? '—' : `${Math.round(n)}%`);

export default function AdminDashboard({ stats }) {
  const del = useDeleteTest();
  const { totals } = stats;
  const tiles = [
    { label: 'Published tests', value: totals.tests },
    { label: 'Students', value: totals.students, href: '/admin/users' },
    { label: 'Mocks taken', value: totals.attempts },
    { label: 'Average score', value: pct(totals.avgPct) },
  ];

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <p className={s.kicker}>Admin</p>
          <h1>Tests &amp; results</h1>
        </div>
        <Link href="/admin/tests/new" className={s.primary}>+ Create test</Link>
      </header>

      <div className={s.tiles}>
        {tiles.map((t) => (
          <section key={t.label} className={s.tile}>
            <span>{t.label}</span>
            <strong className="mono">{t.value}</strong>
            {t.href && <Link href={t.href} className={s.tileLink}>View all ›</Link>}
          </section>
        ))}
      </div>

      <section className={s.card}>
        <h2>Tests</h2>
        {stats.tests.length === 0 ? (
          <p className={s.muted}>No tests yet. <Link href="/admin/tests/new">Create the first one</Link>.</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr><th>Title</th><th>Exam</th><th>Questions</th><th>Minutes</th><th>Taken</th><th>Avg score</th><th><span className={s.srOnly}>Actions</span></th></tr>
              </thead>
              <tbody>
                {stats.tests.map((t) => (
                  <tr key={t.id}>
                    <td><strong>{t.title}</strong></td>
                    <td>{examName(t.exam)} · {stageName(t.stage)}</td>
                    <td className="mono">{t.questions}</td>
                    <td className="mono">{t.minutes}</td>
                    <td className="mono">{t.attempts}</td>
                    <td className="mono">{pct(t.avgPct)}</td>
                    <td className={s.rowActions}>
                      <Link href={`/admin/tests/${t.id}`}>Edit</Link>
                      <Link href={`/test/${t.id}`}>Preview</Link>
                      <button type="button" onClick={() => del.remove(t)} disabled={del.pending}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  );
}
