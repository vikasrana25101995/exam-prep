'use client';
import { useState, useTransition } from 'react';
import { createTestAction } from '../action';
import { blankQuestion, blankTest } from '../constants';

const replaceAt = (arr, i, fn) => arr.map((x, j) => (j === i ? fn(x) : x));

export function useTestBuilder() {
  const [test, setTest] = useState(blankTest);
  const [result, setResult] = useState(null);
  const [pending, startTransition] = useTransition();

  const editSections = (fn) => setTest((t) => ({ ...t, sections: fn(t.sections) }));
  const editQuestion = (si, qi, fn) =>
    editSections((ss) => replaceAt(ss, si, (s) => ({ ...s, questions: replaceAt(s.questions, qi, fn) })));

  return {
    test,
    result,
    pending,
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
    save: () => startTransition(async () => {
      const res = await createTestAction({
        ...test,
        negativeMark: Number(test.negativeMark),
        sections: test.sections.map((s) => ({ ...s, durationMin: Number(s.durationMin) })),
      });
      setResult(res);
      if (!res.errors) setTest(blankTest(test.exam, test.stage));
    }),
  };
}
