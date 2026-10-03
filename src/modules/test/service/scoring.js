// Pure scoring, kept separate from the db service so it can be checked in isolation.
const pickOf = (qn, responses) => {
  const picked = responses[qn.id];
  return Number.isInteger(picked) && picked >= 0 && picked < qn.options.length ? picked : null;
};

export function scoreAttempt(test, responses) {
  const topics = {};
  const sections = test.sections.map((sec) => {
    let correct = 0, wrong = 0;
    for (const qn of sec.questions) {
      const picked = pickOf(qn, responses);
      if (picked === null) continue;
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

// One section, plus a snapshot of every question so the review survives the test being edited.
export function scorePractice(section, negativeMark, responses) {
  const { correct, wrong, score, max } = scoreAttempt({ negativeMark, sections: [section] }, responses).sections[0];
  const questions = section.questions.map((qn) => ({
    text: qn.text, options: qn.options, answer: qn.answer, topic: qn.topic ?? '', picked: pickOf(qn, responses),
  }));
  return { correct, wrong, score, max, questions };
}
