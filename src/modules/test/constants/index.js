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
export const practiceKey = (testId, sectionId, startedAt) => `practice:${testId}:${sectionId}:${startedAt}`;
export const MAX_PRACTICE_MIN = 180;
