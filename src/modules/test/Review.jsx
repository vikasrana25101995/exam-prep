import Link from 'next/link';
import d from '@/modules/dashboard/style/index.module.scss';
import { examName, stageName } from '@/constants';
import { QuestionList } from '@/modules/practice/Review';
import { day, fmt } from '@/modules/practice/constants';
import s from '@/modules/practice/style/index.module.scss';

export default function Review({ a }) {
  return (
    <main className={d.page}>
      <header className={d.head}>
        <div><p className={d.kicker}>Mock review · {examName(a.exam)} {stageName(a.stage)} · {day(a.submittedAt)}</p><h1>{a.testTitle}</h1></div>
        <Link href="/dashboard" className={d.link}>‹ Back to dashboard</Link>
      </header>

      <ul className={s.stats}>
        <li><strong className="mono">{fmt(a.total)}/{a.max}</strong>Total</li>
        {a.sections.map((sec) => <li key={sec.name}><strong className="mono">{fmt(sec.score)}/{sec.max}</strong>{sec.name}</li>)}
      </ul>

      {!a.questions ? (
        <p className={d.info}>Answer review isn&apos;t available for mocks taken before it was added.</p>
      ) : a.questions.map((sec) => (
        <section key={sec.name}>
          <h2 className={d.label}>{sec.name}</h2>
          <QuestionList questions={sec.questions} />
        </section>
      ))}
    </main>
  );
}
