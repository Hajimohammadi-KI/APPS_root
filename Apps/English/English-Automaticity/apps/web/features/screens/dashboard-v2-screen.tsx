"use client";

import { useEffect, useState } from "react";
import { watchDailyDashboard, type DailyDashboard } from "@automaticity/learning-core/automaticity";
import { LearningHome } from "@/components/learning-home";
import { useAppStore } from "@/features/store/app-store";
import { AutomaticityEvidenceSummary } from "@/features/components/automaticity-evidence-summary";

export function DashboardV2Screen() {
  const { state } = useAppStore();
  const [daily, setDaily] = useState<DailyDashboard | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => watchDailyDashboard("en", (value) => { setDaily(value); setReady(true); }), []);
  return <LearningHome language="en" name={state.learner.displayName} level={state.learner.selfDeclaredLevel ?? "A1"} daily={daily} ready={ready}><AutomaticityEvidenceSummary /></LearningHome>;
}
