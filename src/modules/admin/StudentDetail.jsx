'use client';
import Link from 'next/link';
import { examName, stageName } from '@/constants';
import { fmt } from '@/modules/dashboard/service';
import { useToggleUser } from './hooks';
import { StatusBadge } from './StudentsList';
import s from './style/index.module.scss';

const TopicList = ({ title, topics, empty, tone }) => (
  <div className={s.topicBox}>
    <h3>{title}</h3>
    {topics.length === 0 ? <p className={s.muted}>{empty}</p> : (
      <ul>
        {topics.map((t) => (
          <li key={`${t.section}|${t.topic}`}>
            <span>{t.topic} <small>{t.section}</small></span>
            <strong className={`mono ${s[tone]}`}>{t.accuracy}%</strong>
          </li>
        ))}
      </ul>
    )}
  </div>
);

function StageReport({ g }) {
  const { data } = g;
  return (
    <section className={s.card}>
      <h2>{examName(g.exam)} {stageName(g.stage)}</h2>

      <div className={s.tiles}>
        <div className={s.tile}><span>Mocks taken</span><strong className="mono">{data.count}</strong></div>
        <div className={s.tile}><span>Average score</span><strong className="mono">{fmt(data.average)}<small> / {data.latest.max}</small></strong></div>
        <div className={s.tile}><span>Best score</span><strong className="mono">{fmt(g.best)}</strong></div>
        <div className={s.tile}><span>Average %</span><strong className="mono">{Math.round(g.avgPct)}%</strong></div>
      </div>

      <h3 className={s.subhead}>Sections</h3>
      <div className={s.secGrid}>
        {data.sections.map((sec) => (
          <div key={sec.name} className={`${s.secBox} ${s[`sec_${sec.tag}`]}`}>
            <div className={s.secTop}><strong>{sec.name}</strong><span className={s[`tag_${sec.tag}`]}>{sec.tagLabel}</span></div>
            <p className="mono">{fmt(sec.avg)} <small>/ {sec.max} avg · {sec.accuracy}% accuracy</small></p>
            {sec.note && <p className={s.muted}>{sec.note}</p>}
          </div>
        ))}
      </div>

      <div className={s.topicGrid}>
        <TopicList title="Strong topics" topics={g.strongTopics} tone="good" empty="No topic at 80% accuracy yet." />
        <TopicList title="Weak topics — needs practice" topics={g.weakTopics} tone="bad" empty="No topic below 65% accuracy." />
      </div>

      <h3 className={s.subhead}>Marks in each mock</h3>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th>Mock</th><th>Test</th><th>Date</th>
              {data.columns.map((c) => <th key={c.name}>{c.short} /{c.max}</th>)}
              <th>Total /{data.latest.max}</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id}>
                <td>Mock {r.mockNo}</td>
                <td>{r.testTitle}</td>
                <td>{r.submittedAt.slice(0, 10)}</td>
                {r.scores.map((sc, i) => <td key={i} className="mono">{sc === null ? '—' : fmt(sc)}</td>)}
                <td className="mono"><strong>{fmt(r.total)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StudentDetail({ student, groups }) {
  const t = useToggleUser();
  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <Link href="/admin/users" className={s.back}>‹ Students</Link>
          <h1 className={s.email}>{student.email}</h1>
          <p className={s.muted}><StatusBadge active={student.active} />{student.createdAt && ` · joined ${student.createdAt.slice(0, 10)}`}</p>
        </div>
        <button type="button" className={student.active ? s.danger : s.primary} onClick={() => t.toggle(student)} disabled={t.pending}>
          {student.active ? 'Deactivate' : 'Activate'}
        </button>
      </header>

      {groups.length === 0
        ? <section className={s.card}><p className={s.muted}>This student hasn&apos;t taken a mock yet.</p></section>
        : groups.map((g) => <StageReport key={`${g.exam}|${g.stage}`} g={g} />)}
    </main>
  );
}
