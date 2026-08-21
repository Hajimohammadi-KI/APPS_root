"use client";

import { Flame } from "lucide-react";
import { calculateStreak } from "@/lib/streak";
import { useLearnerState } from "@/features/learner-state/learner-state-provider";

// Profile (name/avatar/level) and Progress (streak) were previously only
// ever shown on the Dashboard -- every other page (Grammatik-Labor,
// Fortschritt, Gemischtes Training, Studio...) gave no indication of who
// was signed in or how their streak was doing. Rendered from the shared
// AppShell layout so it appears identically on every real route instead of
// being one more thing only the Dashboard happened to compute.
export function ProfileProgressBadge() {
  const { state } = useLearnerState();
  const name = state.learner.displayName.trim() || "Lernende";
  const level = state.learningLevel ?? state.learner.selfDeclaredLevel ?? "A1";
  const verifiedLevel = state.learner.verifiedLevel;
  const streak = calculateStreak(state.activity);
  const initial = name.charAt(0).toUpperCase() || "L";

  return (
    <a className="german-profile-progress-badge" href="/einstellungen">
      {state.learner.avatarDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data: URL, not a static asset Next can optimize
        <img
          alt=""
          className="german-profile-progress-avatar"
          src={state.learner.avatarDataUrl}
        />
      ) : (
        <span aria-hidden className="german-profile-progress-avatar-fallback">
          {initial}
        </span>
      )}
      <span className="german-profile-progress-copy">
        <strong className="german-profile-progress-name">{name}</strong>
        <span className="german-profile-progress-level">
          {verifiedLevel ? `${level} · geprüft ${verifiedLevel}` : level}
        </span>
      </span>
      <span className="german-profile-progress-streak">
        <Flame aria-hidden className="size-3.5" />
        {streak}
      </span>
    </a>
  );
}
