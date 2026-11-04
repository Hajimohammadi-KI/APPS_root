export const LOCAL_MODEL_LOAD_TIMEOUT_MS = 120_000;
export const LOCAL_MODEL_ANALYSIS_TIMEOUT_MS = 90_000;

type ScheduleDeadline = (
  callback: () => void,
  milliseconds: number,
) => () => void;

const scheduleDeadline: ScheduleDeadline = (callback, milliseconds) => {
  const timer = setTimeout(callback, milliseconds);
  return () => clearTimeout(timer);
};

/** A cancelled request cannot time out later, even if its timer was queued. */
export function startLocalModelDeadline(
  milliseconds: number,
  onTimeout: () => void,
  schedule: ScheduleDeadline = scheduleDeadline,
): () => void {
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0)
    throw new Error("A local model deadline must be a positive duration.");
  let active = true;
  const stopTimer = schedule(() => {
    if (!active) return;
    active = false;
    onTimeout();
  }, milliseconds);
  return () => {
    if (!active) return;
    active = false;
    stopTimer();
  };
}
