'use client';
import Link from 'next/link';
import { EXAMS, STAGES } from '@/constants';
import { startNextMockAction } from './action';
import { BANDS, band } from './constants';
import { useDashboard } from './hooks';
import { fmt, signed } from './service';
import s from './style/index.module.scss';

function TrendChart({ points, max }) {
  const W = 620, H = 190, L = 44, R = 30, T = 24, B = 30;
  const vals = points.map((p) => p.total);
  const lo = Math.max(0, Math.floor((Math.min(...vals) - 5) / 10) * 10);
  const hi = Math.min(max, Math.ceil((Math.max(...vals) + 5) / 10) * 10);
  const ticks = Array.from({ length: (hi - lo) / 10 + 1 }, (_, i) => hi - i * 10);
  const x = (i) => L + (points.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (points.length - 1));
  const y = (v) => T + ((hi - v) / (hi - lo || 1)) * (H - T - B);
  const last = points.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.chart} role="img"
      aria-label={`Scores: ${points.map((p) => `${p.label} ${fmt(p.total)}`).join(', ')}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R + 10} y1={y(t)} y2={y(t)} className={s.grid} />
          <text x={L - 14} y={y(t) + 4} className={s.axis} textAnchor="end">{t}</text>
        </g>
      ))}
      <polyline points={points.map((p, i) => `${x(i)},${y(p.total)}`).join(' ')} className={s.line} />
      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={x(i)} cy={y(p.total)} r={i === last ? 5 : 4} className={i === last ? s.dotLast : s.dot} />
          <text x={x(i)} y={H - 6} className={s.axis} textAnchor="middle">{p.label}</text>
          {(i === 0 || i === last) && (
            <text x={x(i)} y={y(p.total) - 12} className={s.pointLabel} textAnchor={i === 0 && last > 0 ? 'start' : 'middle'}>{fmt(p.total)}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function Dashboard({ user, attempts, tests }) {
  const d = useDashboard(attempts, tests);
  const { data } = d;
  const startMock = startNextMockAction.bind(null, d.exam, d.stage);

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <p className={s.kicker}>Welcome back{user.name ? `, ${user.name}` : ''}</p>
          <h1>Your preparation</h1>
        </div>
      </header>

      <h2 className={s.label}>Choose your exam</h2>
      <div className={s.exams}>
        {EXAMS.map((e) => (
          <div key={e.id} className={`${s.exam} ${e.id === d.exam ? s.examOn : ''} ${e.live ? '' : s.examOff}`}>
            <div className={s.examTop}><strong>{e.name}</strong><span className={s.pill}>{e.live ? 'Live' : 'Soon'}</span></div>
            <span>{e.papers}</span>
          </div>
        ))}
      </div>

      <div className={s.stageRow}>
        <div className={s.toggle} role="tablist">
          {STAGES.map((st) => (
            <button key={st.id} role="tab" aria-selected={d.stage === st.id}
              className={d.stage === st.id ? s.toggleOn : undefined} onClick={() => d.setStage(st.id)}>
              {st.name}
            </button>
          ))}
        </div>
        <span className={s.info}>{d.info ?? 'No tests for this stage yet'}</span>
      </div>

      {!data ? (
        <section className={`${s.card} ${s.empty}`}>
          <h3>No mocks yet</h3>
          <p className={s.info}>Take your first {d.stage} mock to see your score trend, section strengths and the topics to practise.</p>
          <form action={startMock}><button className={s.startBtn}>Start Mock 1</button></form>
        </section>
      ) : (
        <>
        <div className={s.topRow}>
          <section className={s.latest}>
            <p className={s.latestLabel}>Latest mock · Mock {data.latest.mockNo}</p>
            <p className={s.bigScore}>{fmt(data.latest.total)}<small>/{data.latest.max}</small></p>
            <p className={s.delta}>{data.latest.delta === null ? 'Your first mock' : `${signed(data.latest.delta)} on your previous mock`}</p>
            <div className={s.latestStats}>
              <div><span>Average score</span><strong className="mono">{fmt(data.average)}</strong></div>
              <div><span>Mocks taken</span><strong className="mono">{data.count}</strong></div>
            </div>
            <form action={startMock}>
              <button className={s.startBtn}>Start Mock {data.count + 1}</button>
            </form>
          </section>

          <section className={`${s.card} ${s.trend}`}>
            <div className={s.cardHead}>
              <h3>Score trend</h3>
              <span>Total score out of {data.latest.max}, last {data.trend.length} mocks</span>
            </div>
            <TrendChart points={data.trend} max={data.latest.max} />
          </section>
        </div>

        <div className={s.sectionRow}>
          {data.sections.map((sec) => (
            <section key={sec.name} className={`${s.card} ${s.secCard} ${sec.tag === 'low' ? s.secLow : ''}`}>
              <div className={s.cardHead}>
                <h3>{sec.name}</h3>
                <span className={`${s.tag} ${s[`tag_${sec.tag}`]}`}>{sec.tagLabel}</span>
              </div>
              <p className={s.secScore}>{fmt(sec.avg)} <small>/ {sec.max} avg</small></p>
              <div className={s.accRow}><span>Accuracy</span><strong>{sec.accuracy}%</strong></div>
              <div className={s.track}><div className={`${s.fill} ${s[`fill_${sec.tag}`]}`} style={{ width: `${sec.accuracy}%` }} /></div>
              {sec.note && <p className={s.secNote}>{sec.note}</p>}
            </section>
          ))}
        </div>

        {data.topics.length > 0 && (
          <div className={s.topicRow}>
            <section className={s.card}>
              <div className={s.cardHead}>
                <h3>Topic accuracy</h3>
                <div className={s.tabs} role="tablist">
                  {data.topicSections.map((name) => (
                    <button key={name} role="tab" aria-selected={d.activeTopic === name}
                      className={d.activeTopic === name ? s.tabOn : undefined} onClick={() => d.setTopicTab(name)}>
                      {data.columns.find((c) => c.name === name)?.short ?? name}
                    </button>
                  ))}
                </div>
              </div>
              <ul className={s.topics}>
                {d.topics.map((t) => (
                  <li key={t.topic}>
                    <span>{t.topic}</span>
                    <div className={s.track}><div className={`${s.fill} ${s[`band_${band(t.accuracy)}`]}`} style={{ width: `${t.accuracy}%` }} /></div>
                    <strong className={`mono ${s[`text_${band(t.accuracy)}`]}`}>{t.accuracy}%</strong>
                  </li>
                ))}
              </ul>
              <ul className={s.legend}>
                {BANDS.map((b) => <li key={b.key}><i className={s[`band_${b.key}`]} />{b.label}</li>)}
              </ul>
            </section>

            <section className={s.workOn}>
              <h3>Work on next</h3>
              {data.workOn.map((t) => (
                <div key={t.topic} className={s.workItem}>
                  <div><strong>{t.topic}</strong><span>{t.short} · {t.accuracy}% accuracy</span></div>
                  {/* ponytail: topic-wise practice sets don't exist yet, so this opens the test list */}
                  <Link href="/tests" className={s.practise}>Practise</Link>
                </div>
              ))}
              <p>Picked from your lowest-accuracy topics across all mocks.</p>
            </section>
          </div>
        )}

        <section className={s.card} id="recent">
          <div className={s.cardHead}>
            <h3>Recent mocks</h3>
            {data.recent.length > data.recentRows && (
              <button className={s.link} onClick={d.toggleShowAll}>{d.showAll ? 'Show less' : `See all ${data.recent.length}`}</button>
            )}
          </div>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Mock</th>
                  {data.columns.map((c) => <th key={c.name}>{c.short} /{c.max}</th>)}
                  <th>Total /{data.latest.max}</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((r) => (
                  <tr key={r.id}>
                    <td>Mock {r.mockNo}</td>
                    {r.scores.map((sc, i) => <td key={i} className="mono">{sc === null ? '—' : fmt(sc)}</td>)}
                    <td className="mono"><strong>{fmt(r.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </>
      )}
    </main>
  );
}
