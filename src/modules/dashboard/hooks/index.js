'use client';
import { useMemo, useState } from 'react';
import { EXAMS } from '@/constants';
import { buildDashboard } from '../service';

export function useDashboard(attempts, tests) {
  const [exam] = useState(EXAMS.find((e) => e.live).id); // ponytail: only one live exam, add a setter when a second goes live
  const [stage, setStage] = useState('prelims');
  const [topicTab, setTopicTab] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const mine = useMemo(() => attempts.filter((a) => a.exam === exam && a.stage === stage), [attempts, exam, stage]);
  const data = useMemo(() => buildDashboard(mine), [mine]); // null until the first mock in this stage

  const stageTest = tests.find((t) => t.exam === exam && t.stage === stage);
  const info = stageTest && [
    `${stageTest.sections.reduce((a, s) => a + s.questions.length, 0)} questions`,
    `${stageTest.sections.reduce((a, s) => a + s.durationMin, 0)} minutes`,
    `${stageTest.sections.length} sections`,
    `−${stageTest.negativeMark} per wrong answer`,
  ].join(' · ');

  const activeTopic = data?.topicSections.includes(topicTab) ? topicTab : data?.topics[0]?.section;

  return {
    exam, stage, setStage, data, info,
    activeTopic, setTopicTab,
    topics: data?.topics.filter((t) => t.section === activeTopic) ?? [],
    recent: !data ? [] : showAll ? data.recent : data.recent.slice(0, data.recentRows),
    showAll, toggleShowAll: () => setShowAll((v) => !v),
  };
}
