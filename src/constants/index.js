export const APP_NAME = 'ExamPrep';

// Add a new paper here and flip `live` when its tests are ready.
export const EXAMS = [
  { id: 'banking', name: 'Banking', papers: 'IBPS PO · SBI PO · Clerk', live: true },
  { id: 'ssc', name: 'SSC CGL', papers: 'Tier 1 · Tier 2', live: true },
  { id: 'railways', name: 'Railways', papers: 'RRB NTPC · Group D', live: false },
  { id: 'insurance', name: 'Insurance', papers: 'LIC AAO · NIACL', live: false },
];

export const STAGES = [
  { id: 'prelims', name: 'Prelims' },
  { id: 'mains', name: 'Mains' },
];

export const examName = (id) => EXAMS.find((e) => e.id === id)?.name ?? id;
export const stageName = (id) => STAGES.find((s) => s.id === id)?.name ?? id;
