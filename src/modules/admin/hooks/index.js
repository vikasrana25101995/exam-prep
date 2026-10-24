'use client';
import { useActionState, useState, useTransition } from 'react';
import { addBankDraftsAction, addStudentAction, deleteBankQuestionAction, generateBankAction, deleteTestAction, generateTestAction, saveBankQuestionAction, saveTestAction, setUserActiveAction } from '../action';
import { MAX_IMPORT_BYTES, MAX_OPTIONS, blankQuestion, blankTest } from '../constants';
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
    // Changing exam or stage swaps in that paper's section template (only while nothing is typed yet).
    setPaper: (k, v) => setTest((t) => {
      const next = { ...t, [k]: v };
      return t.sections.some((s) => s.questions.some((q) => q.text))
        ? next : { ...blankTest(next.exam, next.stage), title: t.title, negativeMark: t.negativeMark };
    }),
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

// Practice bank: one editor form for add and edit. defaults: { exam, stage, section } to prefill new questions.
const blankBankQuestion = (d) => ({ exam: d.exam, stage: d.stage, section: d.section ?? '', topic: '', text: '', options: Array(MAX_OPTIONS).fill(''), answer: 0 });

export function useBankEditor(defaults) {
  const [editingId, setEditingId] = useState(null);
  const [q, setQ] = useState(() => blankBankQuestion(defaults));
  const [errors, setErrors] = useState([]);
  const [saved, setSaved] = useState('');
  const [pending, startTransition] = useTransition();

  // Keep exam/stage/section/topic after adding, so a run of questions on one topic is quick to enter.
  const reset = (keep) => { setEditingId(null); setQ({ ...blankBankQuestion(defaults), ...keep }); setErrors([]); };

  return {
    q, editingId, errors, saved, pending,
    set: (k, v) => setQ((p) => ({ ...p, [k]: v })),
    setOption: (i, v) => setQ((p) => ({ ...p, options: replaceAt(p.options, i, () => v) })),
    edit: (row) => {
      setEditingId(row.id);
      setQ({ ...row, options: Array.from({ length: MAX_OPTIONS }, (_, i) => row.options[i] ?? '') });
      setErrors([]);
      setSaved('');
    },
    cancel: () => reset(),
    save: () => startTransition(async () => {
      const res = await saveBankQuestionAction(editingId, q);
      if (res.errors) { setErrors(res.errors); return; }
      setSaved(editingId ? 'Question updated.' : 'Question added.');
      reset({ exam: q.exam, stage: q.stage, section: q.section, topic: q.topic });
    }),
    remove: (row) => {
      if (window.confirm('Delete this practice question? Past practice reviews keep their copy.')) startTransition(() => deleteBankQuestionAction(row.id));
    },
  };
}

// Upload to /api/admin/import. Returns per-file results.
export function useImport() {
  const [state, setState] = useState({ pending: false, error: '', results: null });
  return {
    ...state,
    upload: async (form) => {
      const files = form.getAll('files').filter((f) => f.size > 0);
      if (!files.length) return setState({ pending: false, error: 'Choose at least one file.', results: null });
      if (files.reduce((a, f) => a + f.size, 0) > MAX_IMPORT_BYTES) {
        return setState({ pending: false, error: `Files are larger than ${MAX_IMPORT_BYTES / 1024 / 1024}MB in total. Split the upload.`, results: null });
      }
      setState({ pending: true, error: '', results: null });
      try {
        const res = await fetch('/api/admin/import', { method: 'POST', body: form });
        const body = await res.json().catch(() => ({ error: `Upload failed (HTTP ${res.status}).` }));
        setState({ pending: false, error: body.error ?? '', results: body.results ?? null });
      } catch {
        setState({ pending: false, error: 'Upload failed. Check your connection and try again.', results: null });
      }
    },
  };
}

// AI drafts for the practice bank: generate, untick what you don't want, add the rest.
export function useBankGenerator() {
  const [drafts, setDrafts] = useState([]);
  const [skip, setSkip] = useState(() => new Set());
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState('');
  const [generating, startGenerating] = useTransition();
  const [adding, startAdding] = useTransition();
  const chosen = drafts.filter((_, i) => !skip.has(i));

  return {
    drafts, errors, notice, generating, adding,
    chosenCount: chosen.length,
    isChosen: (i) => !skip.has(i),
    toggle: (i) => setSkip((cur) => { const n = new Set(cur); if (n.has(i)) n.delete(i); else n.add(i); return n; }),
    generate: (opts) => startGenerating(async () => {
      setNotice('');
      const res = await generateBankAction(opts);
      setDrafts(res.drafts ?? []);
      setSkip(new Set());
      setErrors(res.errors ?? []);
    }),
    add: () => startAdding(async () => {
      const res = await addBankDraftsAction(chosen);
      if (res.errors) { setErrors(res.errors); return; }
      setDrafts([]);
      setErrors([]);
      setNotice(`Added ${res.added} question${res.added === 1 ? '' : 's'} to the practice bank.`);
    }),
    discard: () => { setDrafts([]); setErrors([]); setNotice(''); },
  };
}
