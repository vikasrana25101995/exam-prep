export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

export const STATUS = {
  answered: 'answered',
  notAnswered: 'notAnswered',
  notVisited: 'notVisited',
  marked: 'marked',
  answeredMarked: 'answeredMarked',
};

export const LEGEND = [
  { status: STATUS.answered, label: 'Answered' },
  { status: STATUS.notAnswered, label: 'Not answered' },
  { status: STATUS.notVisited, label: 'Not visited' },
  { status: STATUS.marked, label: 'Marked for review' },
];

export const storageKey = (testId) => `attempt:${testId}`;

const q = (text, options, answer, topic) => ({ text, options, answer, topic });

// Seeded on first run so the app is usable before an admin creates tests.
export const SAMPLE_TEST = {
  title: 'Banking Prelims · Sample Mock',
  exam: 'banking',
  stage: 'prelims',
  negativeMark: 0.25,
  sections: [
    {
      name: 'English Language',
      durationMin: 20,
      questions: [
        q('Fill in the blank.\nThe bank ______ its lending rates after the policy review.', ['raised', 'rose', 'arose', 'risen', 'raising'], 0, 'Fill in the blanks'),
        q('Choose the word most similar in meaning to PRUDENT.', ['Reckless', 'Careful', 'Generous', 'Timid', 'Lazy'], 1, 'Vocabulary'),
        q('Find the part with an error.\n"Neither of the managers (A) / were present (B) / at the meeting (C) / held yesterday (D)."', ['A', 'B', 'C', 'D', 'No error'], 1, 'Error spotting'),
        q('Choose the word opposite in meaning to SCARCE.', ['Rare', 'Meagre', 'Plentiful', 'Sparse', 'Limited'], 2, 'Vocabulary'),
        q('Fill in the blank.\nShe has been working here ______ 2019.', ['for', 'since', 'from', 'by', 'at'], 1, 'Fill in the blanks'),
      ],
    },
    {
      name: 'Quantitative Aptitude',
      durationMin: 20,
      questions: [
        q('What is 15% of 480?', ['62', '72', '68', '75', '80'], 1, 'Simplification'),
        q('Find the next number: 3, 7, 15, 31, 63, ?', ['95', '120', '127', '125', '131'], 2, 'Number series'),
        q('A sum doubles in 8 years at simple interest. What is the rate per annum?', ['10%', '12%', '12.5%', '15%', '8%'], 2, 'Arithmetic word problems'),
        q('If x² − 5x + 6 = 0, what are the roots?', ['1, 6', '2, 3', '−2, −3', '3, 4', '−1, 6'], 1, 'Quadratic equations'),
        q('A train 200 m long passes a pole in 10 s. What is its speed in km/h?', ['60', '72', '80', '54', '90'], 1, 'Arithmetic word problems'),
      ],
    },
    {
      name: 'Reasoning Ability',
      durationMin: 20,
      questions: [
        q('Statements: All banks are buildings. Some buildings are offices.\nConclusion: Some banks are offices.', ['Follows', 'Does not follow', 'Either', 'Neither', 'Cannot say'], 1, 'Syllogism'),
        q('If A > B ≥ C = D, which is definitely true?', ['A > D', 'B > D', 'C > A', 'D > B', 'A = C'], 0, 'Inequality'),
        q('Pointing to a man, Riya says "He is my mother\'s only son." How is he related to Riya?', ['Uncle', 'Cousin', 'Brother', 'Father', 'Nephew'], 2, 'Blood relations'),
        q('Which is the odd one out?', ['Apple', 'Mango', 'Carrot', 'Banana', 'Grapes'], 2, 'Classification'),
        q('If CAT is coded as DBU, how is DOG coded?', ['EPH', 'EOH', 'DPH', 'EPG', 'FPH'], 0, 'Coding-decoding'),
      ],
    },
  ],
};
