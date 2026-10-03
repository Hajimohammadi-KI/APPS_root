import type { AttemptEvent, ExposureEvent } from "./contracts";

/** Reading a saved answer is another learning exposure, including after a review.
 * It can affect later retrieval, but must not retroactively assist the original. */
export function responseExposure(
  attempt: AttemptEvent,
  at: string,
  id: string,
): ExposureEvent {
  return {
    version: 2,
    type: "exposure",
    id,
    language: attempt.language,
    at: new Date(
      Math.max(Date.parse(at), Date.parse(attempt.at) + 1),
    ).toISOString(),
    constructionId: attempt.task.constructionId,
    taskId: attempt.task.id,
    itemFamily: attempt.task.itemFamily,
    kind: "example",
  };
}
