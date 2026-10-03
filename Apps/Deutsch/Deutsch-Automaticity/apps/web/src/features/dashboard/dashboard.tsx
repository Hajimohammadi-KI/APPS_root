"use client";

import { useEffect, useState } from "react";
import {
  watchDailyDashboard,
  type DailyDashboard,
} from "@automaticity/learning-core/automaticity";
import { LearningHome } from "@/components/learning-home";
import { AutomaticityEvidenceSummary } from "@/features/progress/automaticity-evidence-summary";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

export function Dashboard() {
  const { state } = useLearnerState();
  const [daily, setDaily] = useState<DailyDashboard | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(
    () =>
      watchDailyDashboard("de", (value) => {
        setDaily(value);
        setReady(true);
      }),
    [],
  );
  return (
    <LearningHome
      language="de"
      name={state.learner.displayName}
      level={state.learningLevel ?? state.learner.selfDeclaredLevel ?? "A1"}
      daily={daily}
      ready={ready}
    >
      <AutomaticityEvidenceSummary />
    </LearningHome>
  );
}
