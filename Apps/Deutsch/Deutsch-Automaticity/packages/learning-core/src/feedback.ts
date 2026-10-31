/** The one contact address for both apps. While it is empty the contact
 * section stays hidden; set it here, sync the workspaces and release. */
export const FEEDBACK_EMAIL = "";

export const FEEDBACK_MESSAGE_LIMIT = 1500;

export type FeedbackCategory = "bug" | "content" | "idea" | "other";
export const FEEDBACK_CATEGORIES: readonly FeedbackCategory[] = [
  "bug",
  "content",
  "idea",
  "other",
];

const labels = {
  en: {
    app: "English Automaticity",
    bug: "Bug report",
    content: "Content problem",
    idea: "Idea or wish",
    other: "Other feedback",
    category: "Category",
    release: "Release",
    page: "Page",
    note: "Sent from the app's contact form. Please answer to this address.",
  },
  de: {
    app: "DeutschFlow",
    bug: "Fehler melden",
    content: "Inhaltsproblem",
    idea: "Idee oder Wunsch",
    other: "Sonstiges Feedback",
    category: "Kategorie",
    release: "Version",
    page: "Seite",
    note: "Über das Kontaktformular der App gesendet. Bitte an diese Adresse antworten.",
  },
} as const;

export function feedbackCategoryLabel(
  app: "en" | "de",
  category: FeedbackCategory,
): string {
  return labels[app][category];
}

export interface FeedbackDraft {
  readonly app: "en" | "de";
  readonly release: string;
  /** location.pathname + search; only the path is included. */
  readonly page: string;
  readonly category: FeedbackCategory;
  readonly message: string;
}

export type FeedbackEmail =
  | {
      readonly ok: true;
      readonly href: string;
      readonly address: string;
      readonly subject: string;
      readonly body: string;
    }
  | {
      readonly ok: false;
      readonly reason: "unavailable" | "empty" | "too_long";
    };

/** A configured, plausible address, or null to keep the section hidden. */
export function feedbackAddress(value: string = FEEDBACK_EMAIL): string | null {
  const address = value.trim();
  return /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[^\s@<>()",;:.]{2,}$/u.test(address)
    ? address
    : null;
}

/** The learner's own mail app sends the message; nothing is sent from here. */
export function feedbackEmail(
  draft: FeedbackDraft,
  configured: string = FEEDBACK_EMAIL,
): FeedbackEmail {
  const address = feedbackAddress(configured);
  if (!address) return { ok: false, reason: "unavailable" };
  const message = draft.message.trim();
  if (!message) return { ok: false, reason: "empty" };
  // Refused rather than cut, so the learner never sends a shortened text.
  if (message.length > FEEDBACK_MESSAGE_LIMIT)
    return { ok: false, reason: "too_long" };
  const copy = labels[draft.app];
  const path = draft.page.split(/[?#]/u)[0] || "/";
  const subject = `[${copy.app}] ${copy[draft.category]}`;
  const body = [
    message,
    "",
    "—",
    `${copy.category}: ${copy[draft.category]}`,
    `${copy.release}: ${draft.release || "unknown"}`,
    `${copy.page}: ${path}`,
    copy.note,
  ].join("\n");
  const href = `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { ok: true, href, address, subject, body };
}
