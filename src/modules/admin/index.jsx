'use client';
import Link from 'next/link';
import { EXAMS, STAGES, examName, stageName } from '@/constants';
import { OPTION_LETTERS } from '@/modules/test/constants';
import { useTestBuilder } from './hooks';
import s from './style/index.module.scss';

export default function AdminPage({ tests }) {
  const b = useTestBuilder();
  const { test } = b;
  const total = test.sections.reduce((a, sec) => a + sec.questions.length, 0);

  return (
    <main className={s.page}>
      <header>
        <p className={s.kicker}>Admin</p>
        <h1>Create a test</h1>
      </header>

      <form className={s.form} onSubmit={(e) => { e.preventDefault(); b.save(); }}>
        <section className={s.card}>
          <div className={s.grid}>
            <label className={s.wide}>Title
              <input value={test.title} onChange={(e) => b.setField('title', e.target.value)} placeholder="Banking Prelims · Mock 7" required />
            </label>
            <label>Exam
              <select value={test.exam} onChange={(e) => b.setField('exam', e.target.value)}>
                {EXAMS.filter((x) => x.live).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label>Stage
              <select value={test.stage} onChange={(e) => b.setStage(e.target.value)}>
                {STAGES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label>Negative mark per wrong answer
              <input type="number" min="0" max="1" step="0.05" value={test.negativeMark} onChange={(e) => b.setField('negativeMark', e.target.value)} />
            </label>
          </div>
        </section>

        {test.sections.map((sec, si) => (
          <section key={si} className={s.card}>
            <div className={s.sectionHead}>
              <label className={s.wide}>Section {si + 1} name
                <input value={sec.name} onChange={(e) => b.setSection(si, 'name', e.target.value)} required />
              </label>
              <label>Minutes
                <input type="number" min="1" max="300" value={sec.durationMin} onChange={(e) => b.setSection(si, 'durationMin', e.target.value)} required />
              </label>
              {test.sections.length > 1 && (
                <button type="button" className={s.ghost} onClick={() => b.removeSection(si)}>Remove section</button>
              )}
            </div>

            {sec.questions.map((q, qi) => (
              <fieldset key={qi} className={s.question}>
                <legend>Q{qi + 1}</legend>
                <textarea rows={3} value={q.text} onChange={(e) => b.setQuestion(si, qi, 'text', e.target.value)}
                  placeholder="Question text (new lines are kept)" aria-label={`Question ${qi + 1} text`} required />
                <div className={s.options}>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className={s.option}>
                      <input type="radio" name={`ans-${si}-${qi}`} checked={q.answer === oi}
                        onChange={() => b.setQuestion(si, qi, 'answer', oi)} aria-label={`Option ${OPTION_LETTERS[oi]} is correct`} />
                      <span className="mono">{OPTION_LETTERS[oi]}</span>
                      <input value={opt} onChange={(e) => b.setOption(si, qi, oi, e.target.value)} placeholder={oi < 2 ? 'Required' : 'Optional'} aria-label={`Option ${OPTION_LETTERS[oi]}`} />
                    </div>
                  ))}
                </div>
                <div className={s.qFoot}>
                  <input value={q.topic} onChange={(e) => b.setQuestion(si, qi, 'topic', e.target.value)}
                    placeholder="Topic, e.g. Number series (used for topic accuracy)" aria-label="Topic" />
                  {sec.questions.length > 1 && (
                    <button type="button" className={s.ghost} onClick={() => b.removeQuestion(si, qi)}>Remove</button>
                  )}
                </div>
              </fieldset>
            ))}
            <button type="button" className={s.secondary} onClick={() => b.addQuestion(si)}>+ Add question</button>
          </section>
        ))}

        <div className={s.actions}>
          <button type="button" className={s.secondary} onClick={b.addSection}>+ Add section</button>
          <span className={s.muted}>{total} questions · {test.sections.reduce((a, x) => a + Number(x.durationMin || 0), 0)} minutes</span>
          <button className={s.primary} disabled={b.pending}>{b.pending ? 'Saving…' : 'Publish test'}</button>
        </div>

        {b.result?.errors && (
          <ul className={s.errors} role="alert">{b.result.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
        {b.result?.id && (
          <p className={s.success} role="status">Published “{b.result.title}”. <Link href={`/test/${b.result.id}`}>Preview it</Link></p>
        )}
      </form>

      <section className={s.card}>
        <h2>Published tests</h2>
        <table className={s.table}>
          <thead><tr><th>Title</th><th>Exam</th><th>Questions</th><th>Minutes</th></tr></thead>
          <tbody>
            {tests.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{examName(t.exam)} {stageName(t.stage)}</td>
                <td className="mono">{t.sections.reduce((a, x) => a + x.questions.length, 0)}</td>
                <td className="mono">{t.sections.reduce((a, x) => a + x.durationMin, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
