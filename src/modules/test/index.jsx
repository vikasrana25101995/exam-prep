'use client';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { APP_NAME } from '@/constants';
import { LEGEND, OPTION_LETTERS } from './constants';
import { formatClock, useTestSession } from './hooks';
import s from './style/index.module.scss';

export default function TestRunner({ test }) {
  const t = useTestSession(test);
  if (!t.ready) return <main className={s.loading}>Loading test…</main>;

  const { section, question, current } = t;
  // Earlier sections end only on their timer, so submitting is allowed once the last one is open.
  const canSubmit = t.sectionIdx === test.sections.length - 1;
  const onSubmit = () => canSubmit && window.confirm('Submit the whole test now? You cannot change answers after this.') && t.submit();

  return (
    // ponytail: deters casual copying only; DevTools and screenshots still work.
    <div className={s.page} onContextMenu={(e) => e.preventDefault()}>
      <header className={s.header}>
        <div className={s.brand}><Logo /> <strong>{APP_NAME}</strong><span className={s.testName}>{test.title}</span></div>
        <div className={s.headerRight}>
          <div className={s.timer} aria-live="off">
            <span className={s.timerLabel}>Section time left</span>
            <span className="mono">{formatClock(t.remainingMs)}</span>
          </div>
          <button className={s.submitBtn} onClick={onSubmit} disabled={!canSubmit}
            title={canSubmit ? undefined : 'You can submit once you reach the last section.'}>Submit test</button>
        </div>
      </header>

      <nav className={s.sections}>
        <ol>
          {test.sections.map((sec, i) => (
            <li key={sec.id} className={i === t.sectionIdx ? s.sectionActive : undefined}>
              {sec.name}
              {i < t.sectionIdx && <span className={s.badge}>Done</span>}
              {i > t.sectionIdx && <span className={s.badge}>Locked</span>}
            </li>
          ))}
        </ol>
        <p>Sections unlock in order. The next one opens when this timer ends. You can submit in the last section.</p>
      </nav>

      <main className={s.main}>
        <div className={s.qHead}>
          <h1>Question {current + 1} <small>of {section.questions.length} · {section.name}</small></h1>
          <div className={s.marks}>
            <span className={`mono ${s.plus}`}>+1 correct</span>
            <span className={`mono ${s.minus}`}>−{test.negativeMark} wrong</span>
          </div>
        </div>

        <p className={s.qText}>{question.text}</p>

        <fieldset className={s.options}>
          <legend className={s.srOnly}>Options</legend>
          {question.options.map((opt, i) => (
            <label key={i} className={`${s.option} ${t.selected === i ? s.optionOn : ''}`}>
              <input type="radio" name={question.id} checked={t.selected === i} onChange={() => t.select(i)} />
              <span className={`mono ${s.letter}`}>{OPTION_LETTERS[i]}</span>
              {opt}
            </label>
          ))}
        </fieldset>

        {t.error && <p className={s.error} role="alert">{t.error}</p>}
      </main>

      <footer className={s.footer}>
        <button className={s.btn} onClick={t.previous} disabled={current === 0}>‹ Previous</button>
        <button className={s.btn} onClick={t.clear}>Clear response</button>
        <button className={`${s.btn} ${s.markBtn}`} onClick={t.markAndNext}>Mark for review &amp; next</button>
        <button className={`${s.btn} ${s.saveBtn}`} onClick={t.saveAndNext}>Save &amp; next ›</button>
      </footer>

      <aside className={s.aside}>
        <ul className={s.legend}>
          {LEGEND.map((l) => (
            <li key={l.status}><span className={`mono ${s.chip} ${s[l.status]}`}>{t.counts[l.status]}</span>{l.label}</li>
          ))}
        </ul>
        <div className={s.paletteHead}><strong>{section.name}</strong><span>{section.questions.length} questions</span></div>
        <div className={s.palette}>
          {section.questions.map((qn, i) => (
            <button key={qn.id} onClick={() => t.goTo(i)}
              className={`mono ${s.chip} ${s[t.statusOf(qn.id)]} ${i === current ? s.current : ''}`}
              aria-label={`Question ${i + 1}`} aria-current={i === current}>
              {i + 1}
            </button>
          ))}
        </div>
        <p className={s.note}>Marked questions that also have an answer are counted when you submit.</p>
      </aside>

      {t.result && (
        <div className={s.overlay} role="dialog" aria-modal="true" aria-labelledby="done-title">
          <div className={s.modal}>
            <h2 id="done-title">Test submitted</h2>
            <p>Here is what you attempted in each section. Your scores are saved to your dashboard.</p>
            <table className={s.summary}>
              <thead><tr><th>Section</th><th>Attempted</th><th>Not attempted</th></tr></thead>
              <tbody>
                {t.result.sections.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td className={`mono ${s.blue}`}>{r.attempted}</td>
                    <td className={`mono ${s.orange}`}>{r.notAttempted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link href="/dashboard" className={s.resultsBtn}>See results on dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
}
