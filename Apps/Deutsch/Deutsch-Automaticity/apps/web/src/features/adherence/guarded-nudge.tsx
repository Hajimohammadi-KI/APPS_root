"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BellRing, X } from "lucide-react";
import {
  addLocalDays,
  computeReadiness,
  createNudgeEvent,
  differenceInLocalDays,
  evaluateNudge,
  findEligibleTimeIntention,
  loadProfile,
  localDateKey,
  logNudgeEvent,
  NUDGE_COPY,
  readNudgeEvents,
  type ImplementationIntention,
  type PlanDuration,
} from "@automaticity/learning-core";

import { Button } from "@/components/ui/button";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";
import type { LearnerState } from "@grammar/domain";

const copy = NUDGE_COPY.de;

function mostRecentEvidenceDate(state: LearnerState): string | null {
  const dates = [
    ...state.sessions.map((session) => session.date),
    ...state.attempts.map((attempt) => attempt.date),
  ]
    .filter((value) => Number.isFinite(Date.parse(value)))
    .sort((left, right) => Date.parse(right) - Date.parse(left));
  return dates[0] ?? null;
}

function readinessForState(
  state: LearnerState,
  now: Date,
  timeZone: string,
  currentPracticeStreak: number,
) {
  const today = localDateKey(now, timeZone);
  const completedDays = Array.from({ length: 7 }, (_, index) =>
    addLocalDays(today, -index),
  ).filter((date) => (state.activity[date] ?? 0) > 0).length;
  const latest = mostRecentEvidenceDate(state);
  const daysSinceLastSession = latest
    ? Math.max(0, differenceInLocalDays(localDateKey(latest, timeZone), today))
    : 365;
  const planDuration: PlanDuration =
    state.settings.dailyStudyMinutes === 30 ||
    state.settings.dailyStudyMinutes === 45
      ? state.settings.dailyStudyMinutes
      : 15;
  return computeReadiness({
    completionRate7d: completedDays / 7,
    daysSinceLastSession,
    srsReviewBacklog: state.reviews.filter(
      (review) => !review.mastered && review.due <= now.getTime(),
    ).length,
    planDuration,
    currentPracticeStreak,
  });
}

function routeForAction(action: ImplementationIntention["action"]): string {
  if (action === "review_only") return "/wiederholungen";
  if (action === "booster") return "/heute?mode=booster";
  return "/heute";
}

export function GuardedNudge() {
  const { hydrated, state } = useLearnerState();
  const latest = useRef({ hydrated, state });
  const [prompt, setPrompt] = useState<ImplementationIntention | null>(null);
  latest.current = { hydrated, state };

  const evaluate = useCallback(() => {
    if (!latest.current.hydrated || document.visibilityState !== "visible") {
      return;
    }
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const profile = loadProfile(window.localStorage, { now, timeZone });
    const history = readNudgeEvents(window.localStorage, now);
    const trigger = findEligibleTimeIntention(
      profile.intentions,
      now,
      timeZone,
    );
    const reviewBacklog = latest.current.state.reviews.filter(
      (review) => !review.mastered && review.due <= now.getTime(),
    ).length;
    const decision = evaluateNudge({
      trigger,
      now,
      timeZone,
      readiness: readinessForState(
        latest.current.state,
        now,
        timeZone,
        profile.streak.currentPracticeStreak,
      ),
      reviewBacklog,
      optedIn: profile.nudgeOptIn,
      history,
    });
    try {
      logNudgeEvent(
        window.localStorage,
        createNudgeEvent({
          type: "evaluated",
          triggerId: decision.triggerId ?? "no-eligible-trigger",
          occurredAt: decision.evaluatedAt,
          timeZone,
          decision: decision.code,
        }),
      );
      if (decision.eligible && trigger) {
        logNudgeEvent(
          window.localStorage,
          createNudgeEvent({
            type: "shown",
            triggerId: trigger.id,
            occurredAt: decision.evaluatedAt,
            timeZone,
            decision: decision.code,
          }),
        );
        setPrompt(trigger);
      }
    } catch {
      // A blocked local store must fail closed and show no prompt.
    }
  }, []);

  useEffect(() => {
    if (hydrated) evaluate();
  }, [evaluate, hydrated]);

  useEffect(() => {
    const evaluateWhenVisible = () => {
      if (document.visibilityState === "visible") evaluate();
    };
    document.addEventListener("visibilitychange", evaluateWhenVisible);
    window.addEventListener("pageshow", evaluateWhenVisible);
    return () => {
      document.removeEventListener("visibilitychange", evaluateWhenVisible);
      window.removeEventListener("pageshow", evaluateWhenVisible);
    };
  }, [evaluate]);

  function recordAction(type: "accepted" | "dismissed") {
    if (!prompt) return;
    const now = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    try {
      logNudgeEvent(
        window.localStorage,
        createNudgeEvent({
          type,
          triggerId: prompt.id,
          occurredAt: now,
          timeZone,
          decision: "eligible",
        }),
      );
    } catch {
      // The action remains usable even if storage is unavailable.
    }
  }

  if (!prompt) return null;
  return (
    <aside
      aria-labelledby="guarded-nudge-title-de"
      className="fixed inset-x-4 bottom-4 z-[70] rounded-2xl border border-violet-200 bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:max-w-sm"
      data-testid="guarded-in-app-nudge"
      dir={copy.direction}
    >
      <p aria-live="polite" className="sr-only" role="status">
        {copy.promptTitle}. {copy.promptBody}
      </p>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <BellRing aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold" id="guarded-nudge-title-de">
            {copy.promptTitle}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{copy.promptBody}</p>
        </div>
        <Button
          aria-label={copy.close}
          onClick={() => {
            recordAction("dismissed");
            setPrompt(null);
          }}
          size="icon"
          variant="ghost"
        >
          <X aria-hidden className="size-4" />
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => {
            recordAction("accepted");
            window.location.assign(routeForAction(prompt.action));
          }}
        >
          {copy.actions[prompt.action]}
        </Button>
        <Button
          onClick={() => {
            recordAction("dismissed");
            setPrompt(null);
          }}
          variant="outline"
        >
          {copy.dismiss}
        </Button>
      </div>
    </aside>
  );
}
