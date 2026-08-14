"use client";

import { useRouter } from "next/navigation";

// The complete screen-id -> real-URL map. Superset of the old app-shell.tsx
// `replacementRoutes` partial map (which only covered the 6 screens that had
// already escaped the internal screen-switcher) -- now every screen has a
// real route, matching how Deutsch-V10.08.2026 does navigation.
export const SCREEN_PATHS = {
	home: "/",
	daily: "/daily",
	practice: "/practice",
	studio: "/studio",
	progress: "/progress",
	grammar: "/grammar",
	"integrated-skills": "/integrated-skills",
	resources: "/resources",
	errors: "/errors",
	library: "/library",
	notebook: "/notebook",
	flashcards: "/flashcards",
	settings: "/settings",
	teacher: "/teacher",
} as const;

export type ScreenId = keyof typeof SCREEN_PATHS;

export function isScreenId(value: string | null | undefined): value is ScreenId {
	return value !== null && value !== undefined && value in SCREEN_PATHS;
}

export function screenPath(
	target: string,
	params?: Record<string, string | null>,
): string {
	const canonicalTarget = target === "automaticity" ? "daily" : target;
	const path = isScreenId(canonicalTarget)
		? SCREEN_PATHS[canonicalTarget]
		: "/";
	if (!params) return path;
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== null) query.set(key, value);
	}
	const queryString = query.toString();
	return queryString ? `${path}?${queryString}` : path;
}

// Same call signature every screen component already expects
// (`navigate(screen: string, params?: Record<string, string | null>) =>
// void`), now backed by real client-side route navigation instead of the
// old in-memory `screen` state + manual pushState/popstate shim.
export function useAppNavigate() {
	const router = useRouter();
	return function navigate(
		target: string,
		params?: Record<string, string | null>,
	) {
		router.push(screenPath(target, params));
	};
}
