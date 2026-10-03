import { expect, test } from "bun:test";
import { disablePracticeControls } from "./practice-controls";

test("response, help and stage controls stay disabled until an asynchronous check settles", async () => {
  const controls = [
    { disabled: false },
    { disabled: false },
    { disabled: true },
  ];
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const restore = disablePracticeControls(controls);
  const operation = pending.finally(restore);
  await Promise.resolve();
  expect(controls.map((control) => control.disabled)).toEqual([
    true,
    true,
    true,
  ]);
  finish();
  await operation;
  expect(controls.map((control) => control.disabled)).toEqual([
    false,
    false,
    true,
  ]);
});

test("a failed check restores controls without enabling previously locked controls", async () => {
  const controls = [{ disabled: false }, { disabled: true }];
  const restore = disablePracticeControls(controls);
  await expect(
    Promise.reject(new Error("check failed")).finally(restore),
  ).rejects.toThrow("check failed");
  expect(controls.map((control) => control.disabled)).toEqual([false, true]);
});
