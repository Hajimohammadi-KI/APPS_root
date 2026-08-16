"use client";

import { Flame } from "lucide-react";
import { calculateStreak } from "@/lib/streak";
import { useAppStore } from "@/features/store/app-store";

// Profile (name/avatar/level) and Progress (streak) were previously only
// ever shown on the Dashboard -- every other page (Grammar Lab, Progress
// Evidence, Mixed Practice, Studio...) gave no indication of who was
// signed in or how their streak was doing. Rendered from the shared
// AppShell layout so it appears identically on every real route instead
// of being one more thing only the Dashboard happened to compute.
export function ProfileProgressBadge() {
	const { state } = useAppStore();
	const name = state.learner.displayName.trim() || "Learner";
	const level = state.learner.selfDeclaredLevel ?? "A1";
	const verifiedLevel = state.learner.verifiedLevel;
	const streak = calculateStreak(state.activity);
	const initial = name.charAt(0).toUpperCase() || "L";

	return (
		<a className="profile-progress-badge" href="/settings">
			{state.learner.avatarDataUrl ? (
				// eslint-disable-next-line @next/next/no-img-element -- data: URL, not a static asset Next can optimize
				<img
					alt=""
					className="profile-progress-avatar"
					src={state.learner.avatarDataUrl}
				/>
			) : (
				<span aria-hidden className="profile-progress-avatar-fallback">
					{initial}
				</span>
			)}
			<span className="profile-progress-copy">
				<strong className="profile-progress-name">{name}</strong>
				<span className="profile-progress-level">
					{verifiedLevel ? `${level} · verified ${verifiedLevel}` : level}
				</span>
			</span>
			<span className="profile-progress-streak">
				<Flame aria-hidden className="size-3.5" />
				{streak}
			</span>
		</a>
	);
}
