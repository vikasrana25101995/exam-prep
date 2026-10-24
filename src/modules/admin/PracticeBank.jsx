'use client';
import { useState } from 'react';
import Link from 'next/link';
import { EXAMS, STAGES, examName, stageName } from '@/constants';
import { OPTION_LETTERS } from '@/modules/test/constants';
import AiFields, { useAiOptions } from './AiFields';
import Combobox from '@/components/Combobox';
import { TEMPLATES } from './constants';
import { useBankEditor, useBankGenerator } from './hooks';
import s from './style/index.module.scss';

const live = EXAMS.filter((e) => e.live);

function AiBankPanel() {
  const ai = useAiOptions();
  const g = useBankGenerator();
  return (
    <section className={s.card}>
      <h2>Generate practice questions with AI</h2>
      <p className={s.muted}>Claude drafts questions for you to review. Untick any you don’t want, then add the rest to the bank.</p>
      <form className={s.form} onSubmit={(e) => { e.preventDefault(); g.generate(ai.value()); }}>
        <AiFields ai={ai} allLabel="All sections" sectionPrefix="" />
        <div className={s.aiFoot}>
          <button className={s.primary} disabled={g.generating || ai.total < 1}>{g.generating ? 'Generating…' : `Generate ${ai.total} questions`}</button>
          {g.generating && <span className={s.muted} role="status">This can take a minute or two.</span>}
          {g.notice && <span className={s.muted} role="status">{g.notice}</span>}
        </div>
      </form>
      {g.errors.length > 0 && <ul className={s.errors} role="alert">{g.errors.map((e) => <li key={e}>{e}</li>)}</ul>}

      {g.drafts.length > 0 && (
        <>
          <ol className={s.drafts}>
            {g.drafts.map((d, i) => (
              <li key={i} className={g.isChosen(i) ? undefined : s.draftOff}>
                <label className={s.draftHead}>
                  <input type="checkbox" checked={g.isChosen(i)} onChange={() => g.toggle(i)} aria-label={`Keep question ${i + 1}`} />
                  <span className="mono">{d.section}{d.topic && ` · ${d.topic}`}</span>
                </label>
                <p className={s.draftText}>{d.text}</p>
                <ol className={s.draftOpts}>
                  {d.options.map((o, j) => <li key={j} className={j === d.answer ? s.draftAnswer : undefined}><span className="mono">{OPTION_LETTERS[j]}</span> {o}{j === d.answer && ' ✓'}</li>)}
                </ol>
              </li>
            ))}
          </ol>
          <div className={s.aiFoot}>
            <button type="button" className={s.primary} onClick={g.add} disabled={g.adding || !g.chosenCount}>
              {g.adding ? 'Adding…' : `Add ${g.chosenCount} to practice bank`}
            </button>
            <button type="button" className={s.secondary} onClick={g.discard} disabled={g.adding}>Discard</button>
          </div>
        </>
      )}
    </section>
  );
}

// Dropdown options for the editor: the exam's template sections plus any section already in the bank
// for this exam/stage, and the topics already used in the chosen section. Counts = questions in the bank.
function editorOptions(summary, { exam, stage, section }) {
  const here = summary.filter((r) => r.exam === exam && r.stage === stage);
  const count = (rows) => rows.reduce((a, r) => a + r.count, 0);
  const sectionNames = [...new Set([...(TEMPLATES[exam]?.[stage] ?? []).map((t) => t.name), ...here.map((r) => r.section)])];
  const inSection = here.filter((r) => r.section === section && r.topic);
  return {
    sections: sectionNames.map((value) => ({ value, count: count(here.filter((r) => r.section === value)) })),
    topics: inSection.map((r) => ({ value: r.topic, count: r.count })).toSorted((a, b) => a.value.localeCompare(b.value)),
  };
}

// rows: one page of questions. filters: current GET params. sections: names for the filter dropdown.
// summary: [{ exam, stage, section, topic, count }] for the editor's section/topic dropdowns.
export default function PracticeBank({ rows, total, page, pageSize, filters, sections, summary }) {
  const [aiOpen, setAiOpen] = useState(false);
  const b = useBankEditor({ exam: filters.exam || live[0].id, stage: filters.stage || 'prelims', section: filters.section });
  const { q } = b;
  const opts = editorOptions(summary, q);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const pageHref = (p) => `?${new URLSearchParams({ ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page: String(p) })}`;

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <p className={s.kicker}>Admin</p>
          <h1>Practice questions</h1>
          <p className={s.muted}>Separate from mock tests. Students practise a random set from here.</p>
        </div>
        <div className={s.headActions}>
          <Link href="/admin/import" className={s.secondary}>Import file / ZIP</Link>
          <button type="button" className={s.primary} onClick={() => setAiOpen((v) => !v)} aria-expanded={aiOpen}>✦ Generate with AI</button>
        </div>
      </header>

      {aiOpen && <AiBankPanel />}

      <section className={s.card} id="editor">
        <h2>{b.editingId ? 'Edit question' : 'Add a question'}</h2>
        <form className={s.form} onSubmit={(e) => { e.preventDefault(); b.save(); }}>
          <div className={s.grid4}>
            <label>Exam
              <select value={q.exam} onChange={(e) => b.set('exam', e.target.value)}>
                {live.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label>Stage
              <select value={q.stage} onChange={(e) => b.set('stage', e.target.value)}>
                {STAGES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label>Section
              <Combobox value={q.section} onChange={(v) => { if (v !== q.section) b.set('topic', ''); b.set('section', v); }} options={opts.sections} required
                placeholder="Search or add a section" addLabel="Add section" aria-label="Section" />
            </label>
            <label>Topic
              <Combobox value={q.topic} onChange={(v) => b.set('topic', v)} options={opts.topics}
                placeholder={q.section ? 'Search or add a topic' : 'Pick a section first'} addLabel="Add topic" aria-label="Topic" />
            </label>
          </div>

          <textarea rows={3} value={q.text} onChange={(e) => b.set('text', e.target.value)} placeholder="Question text (new lines are kept)" aria-label="Question text" required />
          <div className={s.options}>
            {q.options.map((opt, i) => (
              <div key={i} className={s.option}>
                <input type="radio" name="bank-answer" checked={q.answer === i} onChange={() => b.set('answer', i)} aria-label={`Option ${OPTION_LETTERS[i]} is correct`} />
                <span className="mono">{OPTION_LETTERS[i]}</span>
                <input value={opt} onChange={(e) => b.setOption(i, e.target.value)} placeholder={i < 2 ? 'Required' : 'Optional'} aria-label={`Option ${OPTION_LETTERS[i]}`} />
              </div>
            ))}
          </div>

          <div className={s.aiFoot}>
            <button className={s.primary} disabled={b.pending}>{b.pending ? 'Saving…' : b.editingId ? 'Save changes' : 'Add question'}</button>
            {b.editingId && <button type="button" className={s.secondary} onClick={b.cancel}>Cancel</button>}
            {b.saved && !b.errors.length && <span className={s.muted} role="status">{b.saved}</span>}
          </div>
          {b.errors.length > 0 && <ul className={s.errors} role="alert">{b.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        </form>
      </section>

      <section className={s.card}>
        {/* Plain GET form: filters live in the URL, the server pages the results. */}
        <form method="get" className={s.filters}>
          <select name="exam" defaultValue={filters.exam} aria-label="Exam">
            <option value="">All exams</option>
            {live.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select name="stage" defaultValue={filters.stage} aria-label="Stage">
            <option value="">All stages</option>
            {STAGES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <select name="section" defaultValue={filters.section} aria-label="Section">
            <option value="">All sections</option>
            {sections.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
          <input type="search" name="q" defaultValue={filters.q} placeholder="Search question text" aria-label="Search" className={s.input} />
          <button className={s.secondary}>Filter</button>
        </form>

        <p className={s.muted}>{total} question{total === 1 ? '' : 's'}</p>
        {rows.length === 0 ? (
          <p className={s.muted}>{total === 0 && !Object.values(filters).some(Boolean) ? 'No practice questions yet. Add one above or import a file.' : 'No questions match these filters.'}</p>
        ) : (
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead><tr><th>Question</th><th>Section · Topic</th><th>Exam</th><th>Answer</th><th><span className={s.srOnly}>Actions</span></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={s.qCell} title={r.text}>{r.text}</td>
                    <td>{r.section}{r.topic && <small className={s.muted}> · {r.topic}</small>}</td>
                    <td>{examName(r.exam)} · {stageName(r.stage)}</td>
                    <td className="mono">{OPTION_LETTERS[r.answer]}</td>
                    <td className={s.rowActions}>
                      <a href="#editor" onClick={() => b.edit(r)}>Edit</a>
                      <button type="button" onClick={() => b.remove(r)} disabled={b.pending}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <nav className={s.pager} aria-label="Pages">
            {page > 0 ? <Link href={pageHref(page - 1)}>‹ Previous</Link> : <span />}
            <span className={s.muted}>Page {page + 1} of {pages}</span>
            {page < pages - 1 ? <Link href={pageHref(page + 1)}>Next ›</Link> : <span />}
          </nav>
        )}
      </section>
    </main>
  );
}
