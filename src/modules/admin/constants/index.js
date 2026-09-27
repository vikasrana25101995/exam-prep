export const MAX_OPTIONS = 5;
export const MAX_SECTIONS = 10;

export const blankQuestion = () => ({ text: '', options: Array(MAX_OPTIONS).fill(''), answer: 0, topic: '' });

// Pre-filled to the IBPS/SBI prelims pattern; admins can edit or add sections.
export const TEMPLATES = {
  banking: {
    prelims: [
      { name: 'English Language', durationMin: 20 },
      { name: 'Quantitative Aptitude', durationMin: 20 },
      { name: 'Reasoning Ability', durationMin: 20 },
    ],
    mains: [
      { name: 'Reasoning & Computer Aptitude', durationMin: 60 },
      { name: 'Data Analysis & Interpretation', durationMin: 45 },
      { name: 'General Economy & Banking Awareness', durationMin: 35 },
      { name: 'English Language', durationMin: 40 },
    ],
  },
};

export const blankTest = (exam = 'banking', stage = 'prelims') => ({
  title: '',
  exam,
  stage,
  negativeMark: 0.25,
  sections: (TEMPLATES[exam]?.[stage] ?? [{ name: 'Section 1', durationMin: 20 }])
    .map((s) => ({ ...s, questions: [blankQuestion()] })),
});
