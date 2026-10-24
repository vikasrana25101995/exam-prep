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
  // SSC CGL: prelims = Tier 1, mains = Tier 2 Paper I.
  ssc: {
    prelims: [
      { name: 'General Intelligence & Reasoning', durationMin: 15, count: 25 },
      { name: 'General Awareness', durationMin: 15, count: 25 },
      { name: 'Quantitative Aptitude', durationMin: 15, count: 25 },
      { name: 'English Comprehension', durationMin: 15, count: 25 },
    ],
    mains: [
      { name: 'Mathematical Abilities', durationMin: 30, count: 30 },
      { name: 'Reasoning & General Intelligence', durationMin: 30, count: 30 },
      { name: 'English Language & Comprehension', durationMin: 36, count: 45 },
      { name: 'General Awareness', durationMin: 24, count: 25 },
      { name: 'Computer Knowledge', durationMin: 15, count: 20 },
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

// Import (ZIP / Excel / CSV / JSON / PDF). Limits keep a bad upload from exhausting the server.
export const IMPORT_TARGETS = [
  { id: 'mock', label: 'Mock tests', hint: 'Each file becomes one mock test.' },
  { id: 'practice', label: 'Practice questions', hint: 'Every question goes into the practice bank.' },
];
export const IMPORT_EXTS = ['xlsx', 'csv', 'json', 'pdf'];
export const MAX_IMPORT_BYTES = 25 * 1024 * 1024; // whole upload
export const MAX_ZIP_FILES = 50;
export const MAX_UNZIPPED_BYTES = 60 * 1024 * 1024; // guards against zip bombs
export const MAX_IMPORT_PDFS = 5; // ponytail: each PDF is one Claude call; raise once imports run in the background
export const BANK_PAGE_SIZE = 50;
