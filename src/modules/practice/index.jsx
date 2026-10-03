import Link from 'next/link';
import d from '@/modules/dashboard/style/index.module.scss';
import Picker from './Picker';
import { clock, day, fmt } from './constants';
import s from './style/index.module.scss';

export default function Practice({ tests, history }) {
  return (
    <main className={d.page}>
      <header className={d.head}><div><p className={d.kicker}>Practice</p><h1>Practise one section</h1></div></header>
      <p className={`${d.info} ${s.intro}`}>Pick a section, set your own time, and see every answer when you submit. Practice does not count towards your mock scores.</p>
      <Picker tests={tests} />

      <section className={`${d.card} ${s.history}`} id="history">
        <div className={d.cardHead}><h3>Practice history</h3></div>
        {history.length === 0 ? <p className={d.info}>No practice yet. Your sessions will show up here.</p> : (
          // ponytail: every session in one table; paginate once students pile up hundreds.
          <div className={d.tableWrap}>
            <table className={d.table}>
              <thead><tr><th>Section</th><th>Date</th><th>Score</th><th>Correct</th><th>Wrong</th><th>Time</th><th></th></tr></thead>
              <tbody>
                {history.map((p) => (
                  <tr key={p.id}>
                    <td>{p.sectionName}<small className={s.sub}>{p.testTitle}</small></td>
                    <td>{day(p.submittedAt)}</td>
                    <td className="mono">{fmt(p.score)}/{p.max}</td>
                    <td className="mono">{p.correct}</td>
                    <td className="mono">{p.wrong}</td>
                    <td className="mono">{clock(p.timeUsedSec)} / {p.durationMin}:00</td>
                    <td><Link href={`/practice/${p.id}`} className={d.link}>Review</Link></td>
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
