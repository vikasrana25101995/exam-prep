'use client';
import { useState } from 'react';
import { EXAMS, STAGES } from '@/constants';
import { AI_DEFAULT_PER_SECTION, AI_MAX_PER_SECTION, DIFFICULTIES, TEMPLATES } from './constants';
import s from './style/index.module.scss';

const live = EXAMS.filter((e) => e.live && TEMPLATES[e.id]);

// Options shared by "Generate with AI" for mock tests and for the practice bank.
// paper: 'full' (every section of the stage) or one section name.
export function useAiOptions() {
  const [o, setO] = useState({ exam: live[0]?.id ?? 'banking', stage: 'prelims', paper: 'full', difficulty: 'moderate', count: AI_DEFAULT_PER_SECTION, focus: '' });
  const sections = TEMPLATES[o.exam]?.[o.stage] ?? [];
  return {
    o,
    sections,
    total: (o.paper === 'full' ? sections.length : 1) * (Number(o.count) || 0),
    // Changing exam or stage resets the section, since section names differ.
    set: (k, v) => setO((p) => ({ ...p, [k]: v, ...((k === 'stage' || k === 'exam') && { paper: 'full' }) })),
    value: () => ({ ...o, count: Number(o.count) }),
  };
}

export default function AiFields({ ai, allLabel = 'Full mock (all sections)', sectionPrefix = 'Sectional: ' }) {
  const { o, set, sections } = ai;
  return (
    <div className={s.grid4}>
      <label>Exam
        <select value={o.exam} onChange={(e) => set('exam', e.target.value)}>
          {live.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <label>Stage
        <select value={o.stage} onChange={(e) => set('stage', e.target.value)}>
          {STAGES.filter((x) => TEMPLATES[o.exam]?.[x.id]).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </label>
      <label>Section
        <select value={o.paper} onChange={(e) => set('paper', e.target.value)}>
          <option value="full">{allLabel}</option>
          {sections.map((x) => <option key={x.name} value={x.name}>{sectionPrefix}{x.name}</option>)}
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
  );
}
