import Link from 'next/link';
import { examName, stageName } from '@/constants';
import s from './style/index.module.scss';

export default function TestsList({ tests, attempts }) {
  const taken = new Set(attempts.map((a) => a.testId));
  return (
    <main className={s.page}>
      <header className={s.head}><div><p className={s.kicker}>Take a test</p><h1>Available mocks</h1></div></header>
      {tests.length === 0 && <p className={s.info}>No tests yet. Ask an admin to create one.</p>}
      <div className={s.testGrid}>
        {tests.map((t) => (
          <section key={t.id} className={`${s.card} ${s.testCard}`}>
            <p className={s.label}>{examName(t.exam)} · {stageName(t.stage)}</p>
            <h3>{t.title}</h3>
            <p className={s.info}>
              {t.sections.reduce((a, x) => a + x.questions.length, 0)} questions ·{' '}
              {t.sections.reduce((a, x) => a + x.durationMin, 0)} minutes · {t.sections.length} sections
            </p>
            <Link href={`/test/${t.id}`} className={s.startBtn}>{taken.has(t.id) ? 'Retake' : 'Start'}</Link>
          </section>
        ))}
      </div>
    </main>
  );
}
