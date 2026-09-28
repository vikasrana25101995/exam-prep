'use client';
import { useActionState, useState, useTransition } from 'react';
import { addStudentAction, deleteTestAction, generateTestAction, saveTestAction, setUserActiveAction } from '../action';
import { MAX_OPTIONS, blankQuestion, blankTest } from '../constants';
import { parseImport } from '../service';

const replaceAt = (arr, i, fn) => arr.map((x, j) => (j === i ? fn(x) : x));

// Editing: pad saved options back to MAX_OPTIONS inputs.
const toForm = (t) => ({
  ...t,
  sections: t.sections.map((s) => ({
    ...s,
    questions: s.questions.map((q) => ({ ...q, options: Array.from({ length: MAX_OPTIONS }, (_, i) => q.options[i] ?? '') })),
  })),
});

export function useTestBuilder(initial, testId = null) {
  const [test, setTest] = useState(() => (initial ? toForm(initial) : blankTest()));
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();
  const [generating, startGenerating] = useTransition();

  const editSections = (fn) => setTest((t) => ({ ...t, sections: fn(t.sections) }));
  const editQuestion = (si, qi, fn) =>
    editSections((ss) => replaceAt(ss, si, (s) => ({ ...s, questions: replaceAt(s.questions, qi, fn) })));

  return {
    test,
    result,
    pending,
    generating,
    // Replaces the form with a Claude-drafted paper for the admin to review; returns true on success.
    generate: (opts) => new Promise((resolve) => startGenerating(async () => {
      const res = await generateTestAction(opts);
      if (res.test) { setTest(res.test); setResult(null); } else { setResult(res); }
      resolve(!!res.test);
    })),
    setField: (k, v) => setTest((t) => ({ ...t, [k]: v })),
    // Changing stage swaps in that stage's section template (only while nothing is typed yet).
    setStage: (stage) => setTest((t) => (t.sections.some((s) => s.questions.some((q) => q.text))
      ? { ...t, stage } : { ...blankTest(t.exam, stage), title: t.title, negativeMark: t.negativeMark })),
    setSection: (si, k, v) => editSections((ss) => replaceAt(ss, si, (s) => ({ ...s, [k]: v }))),
    addSection: () => editSections((ss) => [...ss, { name: '', durationMin: 20, questions: [blankQuestion()] }]),
    removeSection: (si) => editSections((ss) => ss.filter((_, j) => j !== si)),
    addQuestion: (si) => editSections((ss) => replaceAt(ss, si, (s) => ({ ...s, questions: [...s.questions, blankQuestion()] }))),
    removeQuestion: (si, qi) => editSections((ss) => replaceAt(ss, si, (s) => ({ ...s, questions: s.questions.filter((_, j) => j !== qi) }))),
    setQuestion: (si, qi, k, v) => editQuestion(si, qi, (q) => ({ ...q, [k]: v })),
    setOption: (si, qi, oi, v) => editQuestion(si, qi, (q) => ({ ...q, options: replaceAt(q.options, oi, () => v) })),
    importJson: (text) => {
      try {
        setTest(parseImport(text, MAX_OPTIONS));
        setResult(null);
        return true;
      } catch (e) {
        setResult({ errors: [`Import failed: ${e.message}`] });
        return false;
      }
    },
    save: () => startTransition(async () => {
      const res = await saveTestAction(testId, {
        ...test,
        negativeMark: Number(test.negativeMark),
        sections: test.sections.map((s) => ({ ...s, durationMin: Number(s.durationMin) })),
      });
      setResult(res); // only reached on errors; success redirects
    }),
  };
}

export function useDeleteTest() {
  const [pending, startTransition] = useTransition();
  return {
    pending,
    remove: (t) => {
      if (window.confirm(`Delete "${t.title}"? Students' past scores are kept.`)) startTransition(() => deleteTestAction(t.id));
    },
  };
}

export function useToggleUser() {
  const [pending, startTransition] = useTransition();
  return {
    pending,
    toggle: (u) => {
      const verb = u.active ? 'Deactivate' : 'Activate';
      const note = u.active ? ' They will be logged out and cannot log in until reactivated.' : '';
      if (!window.confirm(`${verb} ${u.email}?${note}`)) return;
      startTransition(async () => {
        const res = await setUserActiveAction(u.id, !u.active);
        if (res.error) window.alert(res.error);
      });
    },
  };
}

export function useAddStudent() {
  const [state, formAction, pending] = useActionState(addStudentAction, {});
  const [copied, setCopied] = useState(false);
  return {
    state,
    formAction,
    pending,
    copied,
    copy: async () => {
      const { email, password } = state.created;
      try {
        await navigator.clipboard.writeText(`Login: ${email}\nPassword: ${password}`);
        setCopied(true);
      } catch { /* clipboard blocked: the details are still on screen */ }
    },
  };
}
