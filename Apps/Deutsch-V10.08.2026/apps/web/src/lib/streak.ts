import { getTodayKey } from "@grammar/domain";

// Single source of truth for the daily-activity streak calculation.
// Previously duplicated verbatim in features/dashboard/dashboard.tsx;
// extracted so the sidebar's persistent Profile/Progress widget and the
// Dashboard card can never silently drift into two different streak
// numbers on different pages. Uses getTodayKey() (the same helper
// markActivity() writes state.activity keys with) rather than building the
// key locally, so the streak calculation can never disagree with what the
// key actually looks like in storage.
export function dateKey(daysAgo: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return getTodayKey(date);
}

export function calculateStreak(activity: Record<string, number>): number {
  let count = 0;
  for (let index = 0; index < 60; index += 1) {
    if ((activity[dateKey(index)] ?? 0) > 0) count += 1;
    else break;
  }
  return count;
}
