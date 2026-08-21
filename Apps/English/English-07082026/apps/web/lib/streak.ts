import { todayKey } from "@/lib/utils";

// Single source of truth for the daily-activity streak calculation.
// Previously duplicated verbatim in dashboard-v2-screen.tsx (and, before
// this fix, using a DIFFERENT date-key format than the one activity is
// actually recorded under): todayKey() builds keys from
// `date.toISOString().slice(0, 10)` (UTC), but the old inline dateKey()
// built them from local getFullYear/getMonth/getDate instead. Those two
// formats can disagree on which calendar day "today" is near midnight in
// timezones with a large UTC offset, which would have silently
// undercounted or miscounted the streak. Reusing todayKey() here
// guarantees the key format always matches what activity was written
// under, however it's computed.
export function dateKey(daysAgo: number): string {
	const date = new Date();
	date.setHours(12, 0, 0, 0);
	date.setDate(date.getDate() - daysAgo);
	return todayKey(date);
}

export function calculateStreak(activity: Record<string, number>): number {
	let count = 0;
	for (let index = 0; index < 60; index += 1) {
		if ((activity[dateKey(index)] ?? 0) > 0) count += 1;
		else break;
	}
	return count;
}
