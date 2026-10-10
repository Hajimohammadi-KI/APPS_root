export const screenIds = [
	"home",
	"daily",
	"studio",
	"progress",
	"grammar",
	"integrated-skills",
	"resources",
	"errors",
	"library",
	"notebook",
	"flashcards",
	"settings",
	"teacher",
] as const;

export type ScreenId = (typeof screenIds)[number];

export const screenPaths: Record<ScreenId, string> = {
	home: "/",
	daily: "/daily",
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
};

// "automaticity" was the daily screen's name before it became /daily.
const legacyScreenAliases: Record<string, ScreenId> = { automaticity: "daily" };

export function isScreenId(value: unknown): value is ScreenId {
	return (
		typeof value === "string" && (screenIds as readonly string[]).includes(value)
	);
}

export function canonicalScreenId(
	value: string | null | undefined,
): ScreenId | null {
	if (!value) return null;
	const target = legacyScreenAliases[value] ?? value;
	return isScreenId(target) ? target : null;
}

export type ScreenParams = Record<string, string | null>;

export function screenHref(target: ScreenId, params: ScreenParams = {}) {
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (value !== null && key !== "screen") search.set(key, value);
	}
	const query = search.toString();
	return query ? `${screenPaths[target]}?${query}` : screenPaths[target];
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/**
 * Older links addressed shell screens as `/?screen=<id>`; each screen now has
 * its own path. Returns the path such a link should land on, with every other
 * parameter preserved, or null when the URL is not a legacy screen link.
 */
export function legacyScreenRedirect(params: SearchParamsRecord) {
	const requested = params.screen;
	if (requested === undefined) return null;
	const screen =
		canonicalScreenId(Array.isArray(requested) ? requested[0] : requested) ??
		"home";
	const search = new URLSearchParams();
	for (const [key, value] of Object.entries(params)) {
		if (key === "screen" || value === undefined) continue;
		for (const entry of Array.isArray(value) ? value : [value]) {
			search.append(key, entry);
		}
	}
	const query = search.toString();
	return query ? `${screenPaths[screen]}?${query}` : screenPaths[screen];
}
