import {
  qualifyProspectiveReviews,
  type ProspectiveConsent,
  type ExplicitRecallRating,
} from "../automaticity/prospective";
import type { Language } from "../automaticity/contracts";
import { FSRS_SHADOW_ALGORITHM, replayFsrsShadowEvents } from "./scheduler";
/** Read-only candidate calculation: it never writes learner due dates or policy flags. */
export function buildQualifiedFsrsCandidates(
  events: readonly unknown[],
  language: Language,
  now: string,
  consent: ProspectiveConsent | null,
  ratings: readonly ExplicitRecallRating[],
) {
  const qualified = qualifyProspectiveReviews(
    events,
    language,
    now,
    consent,
    ratings,
  );
  const cards = [...new Set(qualified.eligible.map((row) => row.cardId))].map(
    (cardId) => {
      const history = qualified.eligible.filter((row) => row.cardId === cardId);
      return { cardId, history, candidate: replayFsrsShadowEvents(history) };
    },
  );
  return {
    algorithm: FSRS_SHADOW_ALGORITHM,
    language,
    asOf: now,
    learnerScheduleApplied: false as const,
    rolloutEligible: false as const,
    cards,
    excluded: qualified.excluded,
  };
}
