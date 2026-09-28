'use client';
import { useState } from 'react';
import Link from 'next/link';
import { EXAMS, STAGES } from '@/constants';
import { OPTION_LETTERS } from '@/modules/test/constants';
import { AI_DEFAULT_PER_SECTION, AI_MAX_PER_SECTION, DIFFICULTIES, TEMPLATES } from './constants';
import { useTestBuilder } from './hooks';
import s from './style/index.module.scss';

const IMPORT_EXAMPLE = `{
  "title": "Banking Prelims · Mock 8",
  "stage": "prelims",
  "negativeMark": 0.25,
  "sections": [
    { "name": "English Language", "durationMin": 20, "questions": [
      { "text": "Choose the synonym of PRUDENT.", "options": ["Reckless", "Careful", "Lazy", "Timid"], "answer": "B", "topic": "Vocabulary" }
    ] }
  ]
}`;

const Errors = ({ list }) => list?.length ? <ul className={s.errors} role="alert">{list.map((e) => <li key={e}>{e}</li>)}</ul> : null;

function AiPanel({ b, onDone }) {
  const [o, setO] = useState({ exam: 'banking', stage: 'prelims', paper: 'full', difficulty: 'moderate', count: AI_DEFAULT_PER_SECTION, focus: '' });
  const set = (k, v) => setO((p) => ({ ...p, [k]: v, ...(k === 'stage' && { paper: 'full' }) }));
  const sections = TEMPLATES[o.exam]?.[o.stage] ?? [];
  const n = (o.paper === 'full' ? sections.length : 1) * (Number(o.count) || 0);

  return (
    <section className={s.card}>
      <h2>Generate questions with AI</h2>
      <p className={s.muted}>Claude drafts a practice paper into the form below. Nothing is published until you review it and press Publish.</p>
      <form className={s.form} onSubmit={async (e) => { e.preventDefault(); if (await b.generate({ ...o, count: Number(o.count) })) onDone(); }}>
        <div className={s.grid}>
          <label>Stage
            <select value={o.stage} onChange={(e) => set('stage', e.target.value)}>
              {STAGES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </label>
          <label>Paper type
            <select value={o.paper} onChange={(e) => set('paper', e.target.value)}>
              <option value="full">Full mock (all sections)</option>
              {sections.map((x) => <option key={x.name} value={x.name}>Sectional: {x.name}</option>)}
            </select>
          </label>
          <label>Questions per section
            <input type="number" min="1" max={AI_MAX_PER_SECTION} value={o.count} onChange={(e) => set('count', e.target.value)} required />
          </label>
          <fieldset className={`${s.wide} ${s.segmented}`}>
            <legend>Toughness</legend>
            {DIFFICULTIES.map((d) => (
              <label key={d.id} className={o.difficulty === d.id ? s.segOn : undefined} title={d.brief}>
                <input type="radio" name="difficulty" value={d.id} checked={o.difficulty === d.id} onChange={() => set('difficulty', d.id)} />
                {d.label}
              </label>
            ))}
          </fieldset>
          <label className={s.wide}>Focus topics (optional)
            <input value={o.focus} maxLength={300} onChange={(e) => set('focus', e.target.value)} placeholder="e.g. puzzles, data interpretation, error spotting" />
          </label>
        </div>
        <div className={s.aiFoot}>
          <button className={s.primary} disabled={b.generating || n < 1}>{b.generating ? 'Generating…' : `Generate ${n} questions`}</button>
          {b.generating && <span className={s.muted} role="status">This can take a few minutes for a full mock.</span>}
        </div>
      </form>
      <Errors list={b.result?.errors} />
    </section>
  );
}

export default function TestBuilder({ initial, testId }) {
  const b = useTestBuilder(initial, testId);
  const { test } = b;
  const total = test.sections.reduce((a, sec) => a + sec.questions.length, 0);
  const [panel, setPanel] = useState(null); // 'ai' | 'json' | null
  const toggle = (p) => setPanel((cur) => (cur === p ? null : p));
  const [json, setJson] = useState('');

  return (
    <main className={s.page}>
      <header className={s.head}>
        <div>
          <Link href="/admin" className={s.back}>‹ Admin</Link>
          <h1>{testId ? 'Edit test' : 'Create a test'}</h1>
        </div>
        <div className={s.headActions}>
          <button type="button" className={s.secondary} onClick={() => toggle('json')} aria-expanded={panel === 'json'}>Import JSON</button>
          <button type="button" className={s.primary} onClick={() => toggle('ai')} aria-expanded={panel === 'ai'}>✦ Generate with AI</button>
        </div>
      </header>

      {panel === 'ai' && <AiPanel b={b} onDone={() => setPanel(null)} />}

      {panel === 'json' && (
        <section className={s.card}>
          <h2>Import questions from JSON</h2>
          <p className={s.muted}>Replaces the form below. Review it, then publish. <code>answer</code> is a 0-based index or a letter.</p>
          <textarea className={s.json} rows={10} value={json} onChange={(e) => setJson(e.target.value)} placeholder={IMPORT_EXAMPLE} aria-label="Test JSON" />
          <button type="button" className={s.primary} disabled={!json.trim()}
            onClick={() => b.importJson(json) && setPanel(null)}>Load into form</button>
          <Errors list={b.result?.errors} />
        </section>
      )}

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
          <button className={s.primary} disabled={b.pending}>{b.pending ? 'Saving…' : testId ? 'Save changes' : 'Publish test'}</button>
        </div>

        {!panel && b.result?.errors && (
          <ul className={s.errors} role="alert">{b.result.errors.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
      </form>

    </main>
  );
}
