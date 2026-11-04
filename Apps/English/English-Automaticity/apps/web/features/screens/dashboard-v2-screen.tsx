"use client";

import { useEffect, useState } from "react";
import {
  watchDailyDashboard,
  watchLearningPath,
  type DailyDashboard,
  type LearningPathSelection,
} from "@automaticity/learning-core/automaticity";
import { LearningHome } from "@/components/learning-home";
import { useAppStore } from "@/features/store/app-store";
import { AutomaticityEvidenceSummary } from "@/features/components/automaticity-evidence-summary";

export function DashboardV2Screen() {
  const { state } = useAppStore();
  const [daily, setDaily] = useState<DailyDashboard | null>(null);
  const [ready, setReady] = useState(false);
  const [nextStep, setNextStep] = useState<LearningPathSelection | null>(null);
  useEffect(
    () =>
      watchDailyDashboard("en", (value) => {
        setDaily(value);
        setReady(true);
      }),
    [],
  );
  useEffect(() => watchLearningPath("en", setNextStep), []);
  return (
    <LearningHome
      language="en"
      name={state.learner.displayName}
      level={state.learner.selfDeclaredLevel ?? "A1"}
      daily={daily}
      ready={ready}
      nextStep={nextStep}
    >
      <AutomaticityEvidenceSummary />
    </LearningHome>
  );
}
