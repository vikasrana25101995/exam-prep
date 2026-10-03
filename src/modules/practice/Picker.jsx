'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { examName, stageName } from '@/constants';
import { MAX_PRACTICE_MIN } from '@/modules/test/constants';
import d from '@/modules/dashboard/style/index.module.scss';
import s from './style/index.module.scss';

// tests: slim rows [{ id, title, exam, stage, sections: [{ id, name, durationMin, questions }] }], no answers.
export default function Picker({ tests }) {
  const router = useRouter();
  const [testId, setTestId] = useState(tests[0]?.id ?? '');
  const test = tests.find((t) => t.id === testId);
  const [sectionId, setSectionId] = useState(test?.sections[0]?.id ?? '');
  const section = test?.sections.find((x) => x.id === sectionId);
  const [minutes, setMinutes] = useState(section?.durationMin ?? 20);

  const pickSection = (sec) => { setSectionId(sec?.id ?? ''); setMinutes(sec?.durationMin ?? 20); };
  const groups = Object.groupBy(tests, (t) => `${examName(t.exam)} · ${stageName(t.stage)}`);

  // `t` makes each Start a fresh session; a refresh keeps the same URL and resumes it.
  const start = (e) => {
    e.preventDefault();
    router.push(`/practice/run?${new URLSearchParams({ test: testId, section: sectionId, min: minutes, t: Date.now() })}`);
  };

  if (!tests.length) return <p className={d.info}>No tests with questions yet. Ask an admin to create one.</p>;
  return (
    <form className={`${d.card} ${s.picker}`} onSubmit={start}>
      <label>Test
        <select value={testId} onChange={(e) => { setTestId(e.target.value); pickSection(tests.find((t) => t.id === e.target.value).sections[0]); }}>
          {Object.entries(groups).map(([g, list]) => (
            <optgroup key={g} label={g}>{list.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</optgroup>
          ))}
        </select>
      </label>
      <label>Section
        <select value={sectionId} onChange={(e) => pickSection(test.sections.find((x) => x.id === e.target.value))}>
          {test.sections.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.questions} questions)</option>)}
        </select>
      </label>
      <label>Time (minutes)
        <input type="number" min="1" max={MAX_PRACTICE_MIN} step="1" required value={minutes}
          onChange={(e) => setMinutes(e.target.value === '' ? '' : Number(e.target.value))} />
      </label>
      <button className={d.startBtn} disabled={!section}>Start practice</button>
    </form>
  );
}
