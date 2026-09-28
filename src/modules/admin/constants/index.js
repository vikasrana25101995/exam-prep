export const MAX_OPTIONS = 5;
export const MAX_SECTIONS = 10;

export const blankQuestion = () => ({ text: '', options: Array(MAX_OPTIONS).fill(''), answer: 0, topic: '' });

// IBPS/SBI pattern: `count` is the real number of questions, used to scale time for shorter AI papers.
export const TEMPLATES = {
  banking: {
    prelims: [
      { name: 'English Language', durationMin: 20, count: 30 },
      { name: 'Quantitative Aptitude', durationMin: 20, count: 35 },
      { name: 'Reasoning Ability', durationMin: 20, count: 35 },
    ],
    mains: [
      { name: 'Reasoning & Computer Aptitude', durationMin: 60, count: 45 },
      { name: 'Data Analysis & Interpretation', durationMin: 45, count: 35 },
      { name: 'General Economy & Banking Awareness', durationMin: 35, count: 40 },
      { name: 'English Language', durationMin: 40, count: 35 },
    ],
  },
};

export const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', brief: 'Clerk-prelims level: direct, single-step, one concept per question.' },
  { id: 'moderate', label: 'Moderate', brief: 'Typical IBPS/SBI PO prelims level: two-step questions with plausible distractors.' },
  { id: 'hard', label: 'Hard', brief: 'PO mains level: multi-step reasoning, dense data, close distractors, time pressure.' },
];

export const AI_MAX_PER_SECTION = 25; // ponytail: one Claude call per paper; run it twice for a bigger set
export const AI_DEFAULT_PER_SECTION = 10;

export const blankTest = (exam = 'banking', stage = 'prelims') => ({
  title: '',
  exam,
  stage,
  negativeMark: 0.25,
  sections: (TEMPLATES[exam]?.[stage] ?? [{ name: 'Section 1', durationMin: 20 }])
    .map(({ name, durationMin }) => ({ name, durationMin, questions: [blankQuestion()] })),
});
