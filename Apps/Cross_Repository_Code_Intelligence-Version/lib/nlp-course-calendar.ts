import type { NlpCourseSession } from "../app/plan-data";

export function buildCourseReadingPlanDescription(
  session: NlpCourseSession,
  formatReading: (readingId: string) => string,
) {
  if (!session.readingPlan) {
    return `Artikel: ${session.readingIds.map(formatReading).join("; ")}`;
  }

  const lines = [
    `Pflichtquellen: ${session.readingPlan.required.map(formatReading).join("; ")}`,
    session.readingPlan.reuse.length > 0
      ? `Notizen wiederverwenden (nicht erneut lesen): ${session.readingPlan.reuse.map(formatReading).join("; ")}`
      : "",
    `Optional / Related Work: ${session.readingPlan.optional.map(formatReading).join("; ")}`,
    `Pflichtergebnisse: ${session.readingPlan.deliverables
      .map((deliverable) => `${deliverable.title} — ${deliverable.acceptance}`)
      .join("; ")}`,
  ];

  return lines.filter(Boolean).join("\n");
}
