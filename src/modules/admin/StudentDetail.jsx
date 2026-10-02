'use client';
import Link from 'next/link';
import { useState } from 'react';
import { examName, stageName } from '@/constants';
import { fmt } from '@/modules/dashboard/service';
import { useToggleUser } from './hooks';
import DataTable from './DataTable';
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

    </section>
  );
}

function MockTable({ g }) {
  const { data } = g;
  const columns = [
    { key: 'mock', label: 'Mock', value: (r) => r.mockNo, render: (r) => `Mock ${r.mockNo}` },
    { key: 'test', label: 'Test', value: (r) => r.testTitle },
    { key: 'date', label: 'Date', value: (r) => r.submittedAt.slice(0, 10) },
    ...data.columns.map((c, i) => ({
      key: c.name, label: `${c.short} /${c.max}`, value: (r) => r.scores[i],
      render: (r) => <span className="mono">{r.scores[i] === null ? '—' : fmt(r.scores[i])}</span>,
    })),
    { key: 'total', label: `Total /${data.latest.max}`, value: (r) => r.total, render: (r) => <strong className="mono">{fmt(r.total)}</strong> },
  ];
  return (
    <section className={s.card}>
      <h2>{examName(g.exam)} {stageName(g.stage)}</h2>
      <DataTable columns={columns} rows={data.recent} empty="No mocks match." />
    </section>
  );
}

const TABS = [['info', 'Student info'], ['mocks', 'Mock tests']];

export default function StudentDetail({ student, groups }) {
  const t = useToggleUser();
  const [tab, setTab] = useState('info');
  const mocks = groups.reduce((n, g) => n + g.data.count, 0);
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

      <div role="tablist" aria-label="Student details" className={s.tabs}>
        {TABS.map(([id, label]) => (
          <button
            key={id} type="button" role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`}
            aria-selected={tab === id} className={tab === id ? s.tabOn : undefined} onClick={() => setTab(id)}
          >
            {label}{id === 'mocks' && <span className={s.tabCount}>{mocks}</span>}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className={s.tabPanel}>
        {tab === 'info' && (
          <>
            <section className={s.card}>
              <h2>Profile</h2>
              <dl className={s.info}>
                <dt>Email</dt><dd>{student.email}</dd>
                <dt>Status</dt><dd><StatusBadge active={student.active} /></dd>
                <dt>Joined</dt><dd>{student.createdAt ? student.createdAt.slice(0, 10) : '—'}</dd>
                <dt>Mocks taken</dt><dd className="mono">{mocks}</dd>
              </dl>
            </section>
            {groups.map((g) => <StageReport key={`${g.exam}|${g.stage}`} g={g} />)}
          </>
        )}
        {tab === 'mocks' && (groups.length === 0
          ? <section className={s.card}><p className={s.muted}>This student hasn&apos;t taken a mock yet.</p></section>
          : groups.map((g) => <MockTable key={`${g.exam}|${g.stage}`} g={g} />))}
      </div>
    </main>
  );
}
