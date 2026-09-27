// Pure scoring, kept separate from the db service so it can be checked in isolation.
export function scoreAttempt(test, responses) {
  const topics = {};
  const sections = test.sections.map((sec) => {
    let correct = 0, wrong = 0;
    for (const qn of sec.questions) {
      const picked = responses[qn.id];
      if (!Number.isInteger(picked) || picked < 0 || picked >= qn.options.length) continue;
      const ok = picked === qn.answer;
      ok ? correct++ : wrong++;
      if (qn.topic) {
        const key = `${sec.name}|${qn.topic}`;
        topics[key] ??= { section: sec.name, topic: qn.topic, attempted: 0, correct: 0 };
        topics[key].attempted++;
        if (ok) topics[key].correct++;
      }
    }
    const max = sec.questions.length;
    return { name: sec.name, max, attempted: correct + wrong, correct, wrong, score: correct - wrong * test.negativeMark };
  });
  return {
    sections,
    topics: Object.values(topics),
    total: sections.reduce((a, s) => a + s.score, 0),
    max: sections.reduce((a, s) => a + s.max, 0),
  };
}
