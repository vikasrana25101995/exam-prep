'use client';
import { useState } from 'react';
import Link from 'next/link';
import { EXAMS, STAGES } from '@/constants';
import { IMPORT_TARGETS, MAX_IMPORT_BYTES, MAX_IMPORT_PDFS, MAX_ZIP_FILES } from './constants';
import { useImport } from './hooks';
import s from './style/index.module.scss';

export default function ImportPage() {
  const im = useImport();
  const [target, setTarget] = useState('practice');

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <Link href="/admin" className={s.back}>‹ Mock tests</Link>
          <h1>Import questions</h1>
        </div>
      </header>

      <section className={s.card}>
        <form className={s.form} onSubmit={(e) => { e.preventDefault(); im.upload(new FormData(e.currentTarget)); }}>
          <fieldset className={s.targets}>
            <legend>Import into</legend>
            {IMPORT_TARGETS.map((t) => (
              <label key={t.id} className={target === t.id ? s.targetOn : undefined}>
                <input type="radio" name="target" value={t.id} checked={target === t.id} onChange={() => setTarget(t.id)} />
                <strong>{t.label}</strong>
                <span>{t.hint}</span>
              </label>
            ))}
          </fieldset>

          <div className={s.grid}>
            <label>Exam
              <select name="exam" defaultValue={EXAMS.find((e) => e.live).id}>
                {EXAMS.filter((e) => e.live).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </label>
            <label>Stage
              <select name="stage" defaultValue="prelims">
                {STAGES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
            </label>
            {target === 'mock' && (
              <label>Negative mark per wrong answer
                <input name="negativeMark" type="number" min="0" max="1" step="0.05" defaultValue="0.25" />
              </label>
            )}
            <label className={s.wide}>Files
              <input name="files" type="file" multiple required accept=".zip,.xlsx,.csv,.json,.pdf" />
            </label>
          </div>

          <div className={s.aiFoot}>
            <button className={s.primary} disabled={im.pending}>{im.pending ? 'Importing…' : 'Import'}</button>
            {im.pending && <span className={s.muted} role="status">PDFs are read by AI and can take a few minutes each.</span>}
          </div>
          {im.error && <p className={s.errors} role="alert">{im.error}</p>}
        </form>
      </section>

      {im.results && (
        <section className={s.card} aria-live="polite">
          <h2>Results</h2>
          <ul className={s.results}>
            {im.results.map((r, i) => (
              <li key={i} className={r.ok ? s.resOk : s.resFail}>
                <div><strong>{r.ok ? '✓' : '✕'} {r.file}</strong> <span>{r.message}</span>
                  {r.testId && <> <Link href={`/admin/tests/${r.testId}`}>Review test</Link></>}
                </div>
                {r.errors.length > 0 && <ul>{r.errors.map((e, j) => <li key={j}>{e}</li>)}</ul>}
              </li>
            ))}
          </ul>
          {target === 'practice' && <Link href="/admin/practice" className={s.tileLink}>Open the practice bank ›</Link>}
        </section>
      )}

      <section className={s.card}>
        <h2>File formats</h2>
        <ul className={s.help}>
          <li><strong>ZIP</strong>: any mix of the files below, up to {MAX_ZIP_FILES} files. Total upload up to {MAX_IMPORT_BYTES / 1024 / 1024}MB.</li>
          <li><strong>Excel (.xlsx) or CSV</strong>: one row per question with columns <code>Section, Topic, Question, Option A … Option E, Answer</code> (Answer is A–E or 1–5). Optional <code>Minutes</code> sets a section’s time, <code>Title</code> names the test. In Excel, a sheet without a Section column uses the sheet name. <a href="/templates/questions-template.csv" download>Download template</a></li>
          <li><strong>JSON</strong>: the test format from “Import JSON” in the test builder, or an array of questions with a <code>section</code> field. Answer is a 0-based index or a letter. <a href="/templates/mock-test-example.json" download>Example test</a> · <a href="/templates/practice-questions-example.json" download>Example questions</a></li>
          <li><strong>PDF</strong>: question papers are read by AI (answer key used if present, otherwise solved). Up to {MAX_IMPORT_PDFS} PDFs per upload. Review the result before students use it.</li>
          <li>For <strong>mock tests</strong>, each file becomes one test (named from its Title or file name) and is saved only if every question is valid. For <strong>practice</strong>, valid questions are added and bad rows are listed.</li>
        </ul>
      </section>
    </main>
  );
}
