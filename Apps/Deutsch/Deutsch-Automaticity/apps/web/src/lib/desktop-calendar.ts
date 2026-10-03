import type { LearnerState } from "@grammar/domain";

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

export function learnerStateCalendarEvents(
  state: LearnerState,
): DesktopCalendarEvent[] {
  const reviews = state.reviews
    .filter((review) => !review.mastered)
    .map((review) => ({
      id: `review:${review.id}`,
      date: localDateKey(review.due),
      title: `Deutsch-Wiederholung: ${review.topic}`,
      description: `Übungsmodus: ${review.reviewMode}. Öffne DeutschFlow, um diese geplante Wiederholung zu bearbeiten.`,
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
      title: "DeutschFlow Tagestraining",
      description: `${plan.completed.length} Übungsschritt(e) abgeschlossen. Setze den Tagesplan in DeutschFlow fort.`,
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
    throw new Error(
      "Google Kalender ist in der installierten Windows-App verfügbar.",
    );
  }
  return window.studyCalendar.connect();
}

export async function syncDesktopCalendar(state: LearnerState) {
  if (!window.studyCalendar) {
    throw new Error(
      "Google Kalender ist in der installierten Windows-App verfügbar.",
    );
  }
  return window.studyCalendar.sync(learnerStateCalendarEvents(state));
}

export async function disconnectDesktopCalendar() {
  if (!window.studyCalendar) {
    throw new Error(
      "Google Kalender ist in der installierten Windows-App verfügbar.",
    );
  }
  return window.studyCalendar.disconnect();
}
