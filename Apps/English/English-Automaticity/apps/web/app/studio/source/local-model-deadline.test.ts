import { expect, test } from "bun:test";
import { startLocalModelDeadline } from "./local-model-deadline";

test("a stalled local model expires once", () => {
  let scheduled: (() => void) | undefined;
  let delay = 0,
    stopped = 0,
    expired = 0;
  const cancel = startLocalModelDeadline(
    120000,
    () => {
      expired++;
    },
    (callback, milliseconds) => {
      scheduled = callback;
      delay = milliseconds;
      return () => {
        stopped++;
      };
    },
  );
  expect(delay).toBe(120000);
  scheduled?.();
  scheduled?.();
  cancel();
  expect(expired).toBe(1);
  expect(stopped).toBe(0);
});

test("invalid deadlines never schedule a timer", () => {
  for (const delay of [0, -1, Infinity, NaN, 1.5]) {
    expect(() => startLocalModelDeadline(delay, () => {})).toThrow(
      /positive duration/,
    );
  }
});

test("cancellation or a completed request prevents even a queued timeout from firing", () => {
  let scheduled: (() => void) | undefined;
  let stopped = 0,
    expired = 0;
  const cancel = startLocalModelDeadline(
    90000,
    () => {
      expired++;
    },
    (callback) => {
      scheduled = callback;
      return () => {
        stopped++;
      };
    },
  );
  cancel();
  cancel();
  scheduled?.();
  expect(stopped).toBe(1);
  expect(expired).toBe(0);
});
