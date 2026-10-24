'use client';
import { useActionState, useState } from 'react';
import { EXAMS, STAGES } from '@/constants';
import { MAX_PRACTICE_MIN } from '@/modules/test/constants';
import d from '@/modules/dashboard/style/index.module.scss';
import { startPracticeAction } from './action';
import { DEFAULT_PRACTICE_QUESTIONS, MAX_PRACTICE_QUESTIONS, suggestedMinutes } from './constants';
import s from './style/index.module.scss';

const sum = (rows) => rows.reduce((a, r) => a + r.count, 0);
const uniq = (xs) => [...new Set(xs)];

// summary: [{ exam, stage, section, topic, count }] from the practice bank (no question text).
export default function Picker({ summary }) {
  const [state, formAction, pending] = useActionState(startPracticeAction, {});
  const exams = EXAMS.filter((e) => summary.some((r) => r.exam === e.id));
  const [exam, setExam] = useState(exams[0]?.id ?? '');
  const stages = STAGES.filter((st) => summary.some((r) => r.exam === exam && r.stage === st.id));
  const [stage, setStage] = useState(stages[0]?.id ?? '');
  const inStage = summary.filter((r) => r.exam === exam && r.stage === stage);
  const sections = uniq(inStage.map((r) => r.section)).sort();
  const [section, setSection] = useState(sections[0] ?? '');
  const inSection = inStage.filter((r) => r.section === section);
  const [topics, setTopics] = useState([]);
  const available = sum(topics.length ? inSection.filter((r) => topics.includes(r.topic)) : inSection);
  const [count, setCount] = useState(DEFAULT_PRACTICE_QUESTIONS);
  const [minutes, setMinutes] = useState(suggestedMinutes(DEFAULT_PRACTICE_QUESTIONS, stage));
  const max = Math.min(MAX_PRACTICE_QUESTIONS, available);

  // Changing a parent choice resets everything below it to the first option.
  const pickExam = (v) => {
    const st = STAGES.find((x) => summary.some((r) => r.exam === v && r.stage === x.id))?.id ?? '';
    setExam(v); pickStage(st, v);
  };
  const pickStage = (v, ex = exam) => {
    setStage(v);
    setSection(uniq(summary.filter((r) => r.exam === ex && r.stage === v).map((r) => r.section)).sort()[0] ?? '');
    setTopics([]);
  };
  const toggleTopic = (t) => setTopics((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const setCountAndTime = (v) => { setCount(v); if (v) setMinutes(suggestedMinutes(Number(v), stage)); };

  if (!summary.length) return <p className={d.info}>No practice questions yet. Ask an admin to add some.</p>;
  return (
    <form className={`${d.card} ${s.picker}`} action={formAction}>
      <label>Exam
        <select name="exam" value={exam} onChange={(e) => pickExam(e.target.value)}>
          {exams.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <label>Stage
        <select name="stage" value={stage} onChange={(e) => pickStage(e.target.value)}>
          {stages.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <label>Section
        <select name="section" value={section} onChange={(e) => { setSection(e.target.value); setTopics([]); }}>
          {sections.map((x) => <option key={x} value={x}>{x} ({sum(inStage.filter((r) => r.section === x))})</option>)}
        </select>
      </label>

      {inSection.some((r) => r.topic) && (
        <fieldset className={s.topics}>
          <legend>Topics <span>(optional; none ticked = all)</span></legend>
          {inSection.filter((r) => r.topic).toSorted((a, b) => a.topic.localeCompare(b.topic)).map((r) => (
            <label key={r.topic} className={topics.includes(r.topic) ? s.topicOn : undefined}>
              <input type="checkbox" name="topics" value={r.topic} checked={topics.includes(r.topic)} onChange={() => toggleTopic(r.topic)} />
              {r.topic} <small>{r.count}</small>
            </label>
          ))}
        </fieldset>
      )}

      <label className={s.num}>Questions <small>({available} available)</small>
        <input type="number" name="count" min="1" max={max} step="1" required value={count}
          onChange={(e) => setCountAndTime(e.target.value === '' ? '' : Number(e.target.value))} />
      </label>
      <label className={s.num}>Time (minutes)
        <input type="number" name="minutes" min="1" max={MAX_PRACTICE_MIN} step="1" required value={minutes}
          onChange={(e) => setMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
      </label>
      <button className={d.startBtn} disabled={pending || !available}>{pending ? 'Starting…' : 'Start practice'}</button>
      {state.error && <p className={s.error} role="alert">{state.error}</p>}
    </form>
  );
}
