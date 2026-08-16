import type { AppState } from "@/features/store/app-store";

export interface DesktopCalendarEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface DesktopCalendarStatus {
  available: boolean;
  configured: boolean;
  connected: boolean;
  email: string | null;
  lastSyncAt: string | null;
}

export interface DesktopCalendarSyncResult {
  created: number;
  updated: number;
  unchanged: number;
  deleted: number;
  total: number;
  syncedAt: string;
}

interface DesktopCalendarBridge {
  status: () => Promise<DesktopCalendarStatus>;
  connect: () => Promise<DesktopCalendarStatus>;
  sync: (
    events: readonly DesktopCalendarEvent[],
  ) => Promise<DesktopCalendarSyncResult>;
  disconnect: () => Promise<DesktopCalendarStatus>;
}

declare global {
  interface Window {
    studyCalendar?: DesktopCalendarBridge;
  }
}

function localDateKey(value: number) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function appStateCalendarEvents(
  state: AppState,
): DesktopCalendarEvent[] {
  const reviews = state.reviews
    .filter((review) => review.status === "pending")
    .map((review) => ({
      id: `review:${review.id}`,
      date: localDateKey(review.dueAt),
      title: `English review: ${review.topic}`,
      description: `Practice mode: ${review.mode}. Continue this scheduled grammar review in English Grammar Automaticity.`,
    }));
  const plans = Object.entries(state.dailyPlans)
    .filter(
      ([date, plan]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        (plan.completed.length > 0 || Object.keys(plan.answers).length > 0),
    )
    .map(([date, plan]) => ({
      id: `daily-plan:${date}`,
      date,
      title: "English grammar practice",
      description: `${plan.completed.length} practice step(s) completed. Continue the daily plan in English Grammar Automaticity.`,
    }));

  return [...reviews, ...plans]
    .sort((left, right) =>
      left.date === right.date
        ? left.id.localeCompare(right.id)
        : left.date.localeCompare(right.date),
    )
    .slice(0, 500);
}

export async function readDesktopCalendarStatus() {
  if (!window.studyCalendar) {
    return {
      available: false,
      configured: false,
      connected: false,
      email: null,
      lastSyncAt: null,
    } satisfies DesktopCalendarStatus;
  }
  return window.studyCalendar.status();
}

export async function connectDesktopCalendar() {
  if (!window.studyCalendar) {
    throw new Error("Google Calendar is available in the installed Windows app.");
  }
  return window.studyCalendar.connect();
}

export async function syncDesktopCalendar(state: AppState) {
  if (!window.studyCalendar) {
    throw new Error("Google Calendar is available in the installed Windows app.");
  }
  return window.studyCalendar.sync(appStateCalendarEvents(state));
}

export async function disconnectDesktopCalendar() {
  if (!window.studyCalendar) {
    throw new Error("Google Calendar is available in the installed Windows app.");
  }
  return window.studyCalendar.disconnect();
}
