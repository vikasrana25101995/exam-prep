'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { submitTestAction } from '../action';
import { STATUS, storageKey } from '../constants';

const minutes = (m) => m * 60_000;

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function save(key, value) {
  try { value ? localStorage.setItem(key, JSON.stringify(value)) : localStorage.removeItem(key); } catch {}
}

export function useTestSession(test) {
  const key = storageKey(test.id);
  const [s, setS] = useState(null); // null until restored on the client
  const [now, setNow] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  // Restore an in-progress attempt (survives refresh) or start fresh. Runs after
  // hydration because localStorage and Date.now() don't exist on the server.
  useEffect(() => {
    const firstQ = test.sections[0].questions[0].id;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(load(key) ?? {
      sectionIdx: 0,
      endsAt: Date.now() + minutes(test.sections[0].durationMin),
      current: 0,
      responses: {},
      visited: { [firstQ]: true },
      marked: {},
    });
    setNow(Date.now());
  }, [key, test]);

  useEffect(() => { if (s && !result) save(key, s); }, [key, s, result]);

  const submit = useCallback(async () => {
    if (submitting.current || !s) return;
    submitting.current = true;
    setError('');
    try {
      const res = await submitTestAction(test.id, s.responses);
      if (res.error) throw new Error(res.error);
      save(key, null);
      setResult(res);
    } catch (e) {
      submitting.current = false;
      setError(e.message || 'Could not submit. Check your connection and try again.');
    }
  }, [key, s, test.id]);

  const latest = useRef({});
  useEffect(() => { latest.current = { s, submit, done: !!result }; });

  // Section timer: move to the next section when time runs out, submit after the last.
  useEffect(() => {
    const last = test.sections.length - 1;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const { s: cur, submit: doSubmit, done } = latest.current;
      if (!cur || done || t < cur.endsAt) return;
      if (cur.sectionIdx === last) { doSubmit(); return; }
      setS((p) => {
        let n = p;
        while (t >= n.endsAt && n.sectionIdx < last) { // loop covers sections that expired while the tab was closed
          const next = n.sectionIdx + 1;
          const firstQ = test.sections[next].questions[0].id;
          n = { ...n, sectionIdx: next, current: 0, endsAt: n.endsAt + minutes(test.sections[next].durationMin), visited: { ...n.visited, [firstQ]: true } };
        }
        return n;
      });
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [test.sections]);

  if (!s) return { ready: false };

  const section = test.sections[s.sectionIdx];
  const question = section.questions[s.current];
  const qid = question.id;

  const statusOf = (id) => {
    const answered = s.responses[id] !== undefined;
    if (s.marked[id]) return answered ? STATUS.answeredMarked : STATUS.marked;
    if (answered) return STATUS.answered;
    return s.visited[id] ? STATUS.notAnswered : STATUS.notVisited;
  };

  const goTo = (i) => {
    const idx = Math.max(0, Math.min(section.questions.length - 1, i));
    setS((p) => ({ ...p, current: idx, visited: { ...p.visited, [section.questions[idx].id]: true } }));
  };

  const setMark = (on) => setS((p) => ({ ...p, marked: { ...p.marked, [qid]: on } }));

  const counts = section.questions.reduce((acc, qn) => {
    const st = statusOf(qn.id);
    acc[st === STATUS.answeredMarked ? STATUS.marked : st]++;
    return acc;
  }, { answered: 0, notAnswered: 0, notVisited: 0, marked: 0 });

  return {
    ready: true,
    sectionIdx: s.sectionIdx,
    section,
    question,
    current: s.current,
    selected: s.responses[qid],
    remainingMs: Math.max(0, s.endsAt - now),
    counts,
    statusOf,
    result,
    error,
    goTo,
    select: (opt) => setS((p) => ({ ...p, responses: { ...p.responses, [qid]: opt } })),
    clear: () => setS((p) => { const { [qid]: _, ...rest } = p.responses; return { ...p, responses: rest }; }),
    previous: () => goTo(s.current - 1),
    saveAndNext: () => { setMark(false); goTo(s.current + 1); },
    markAndNext: () => { setMark(true); goTo(s.current + 1); },
    submit,
  };
}

export const formatClock = (ms) => {
  const t = Math.ceil(ms / 1000);
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
