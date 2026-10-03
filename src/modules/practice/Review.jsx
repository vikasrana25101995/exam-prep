import Link from 'next/link';
import d from '@/modules/dashboard/style/index.module.scss';
import { OPTION_LETTERS } from '@/modules/test/constants';
import { clock, day, fmt } from './constants';
import s from './style/index.module.scss';

export default function Review({ p }) {
  const skipped = p.max - p.correct - p.wrong;
  return (
    <main className={d.page}>
      <header className={d.head}>
        <div><p className={d.kicker}>Practice review · {day(p.submittedAt)}</p><h1>{p.sectionName}</h1><p className={d.info}>{p.testTitle}</p></div>
        <Link href="/practice" className={d.link}>‹ Back to practice</Link>
      </header>

      <ul className={s.stats}>
        <li><strong className="mono">{fmt(p.score)}/{p.max}</strong>Score</li>
        <li><strong className={`mono ${s.right}`}>{p.correct}</strong>Correct</li>
        <li><strong className={`mono ${s.wrong}`}>{p.wrong}</strong>Wrong</li>
        <li><strong className="mono">{skipped}</strong>Skipped</li>
        <li><strong className="mono">{clock(p.timeUsedSec)}</strong>of {p.durationMin} min</li>
      </ul>

      <ol className={s.questions}>
        {p.questions.map((q, i) => {
          const verdict = q.picked === null ? 'Skipped' : q.picked === q.answer ? 'Correct' : 'Wrong';
          return (
            <li key={i} className={d.card}>
              <div className={s.qHead}>
                <span className="mono">Q{i + 1}{q.topic && ` · ${q.topic}`}</span>
                <span className={`${s.verdict} ${s[verdict]}`}>{verdict}</span>
              </div>
              <p className={s.qText}>{q.text}</p>
              <ul className={s.options}>
                {q.options.map((opt, j) => (
                  <li key={j} className={j === q.answer ? s.right : j === q.picked ? s.wrong : undefined}>
                    <span className="mono">{OPTION_LETTERS[j]}</span>{opt}
                    {j === q.picked ? <em>Your answer</em> : j === q.answer && <em>Correct answer</em>}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
