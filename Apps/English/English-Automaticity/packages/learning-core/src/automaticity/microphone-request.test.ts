import { expect, test } from "bun:test";
import { requestMicrophone } from "./microphone-request";

function deferredInput() {
  let release!: (stream: MediaStream) => void;
  let stopped = 0;
  const stream = {
    getTracks: () => [{ stop: () => stopped++ }],
  } as unknown as MediaStream;
  const pending = new Promise<MediaStream>((resolve) => {
    release = resolve;
  });
  return { stream, pending, release, stopped: () => stopped };
}

test("cancel returns promptly and releases a permission grant arriving later", async () => {
  const input = deferredInput(),
    controller = new AbortController();
  const request = requestMicrophone(() => input.pending, {
    signal: controller.signal,
  });
  controller.abort();
  await expect(request).rejects.toMatchObject({ name: "AbortError" });
  input.release(input.stream);
  await Promise.resolve();
  expect(input.stopped()).toBe(1);
});

test("unanswered permission expires and a late grant cannot keep the microphone on", async () => {
  const input = deferredInput();
  await expect(
    requestMicrophone(() => input.pending, { timeoutMs: 5 }),
  ).rejects.toMatchObject({ name: "TimeoutError" });
  input.release(input.stream);
  await Promise.resolve();
  expect(input.stopped()).toBe(1);
});

test("a cancelled signal never opens a permission request", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await expect(
    requestMicrophone(
      () => {
        calls++;
        return Promise.reject(new Error("unexpected"));
      },
      { signal: controller.signal },
    ),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(calls).toBe(0);
});

test("successful acquisition transfers ownership without stopping a later recording", async () => {
  const input = deferredInput(),
    controller = new AbortController();
  const request = requestMicrophone(() => input.pending, {
    signal: controller.signal,
    timeoutMs: 5,
  });
  input.release(input.stream);
  expect(await request).toBe(input.stream);
  controller.abort();
  await Bun.sleep(10);
  expect(input.stopped()).toBe(0);
});

test("permission rejection and synchronous device failure retain their causes", async () => {
  const denied = new DOMException("Denied", "NotAllowedError");
  await expect(requestMicrophone(() => Promise.reject(denied))).rejects.toBe(
    denied,
  );
  const failure = new Error("Device disconnected");
  await expect(
    requestMicrophone(() => {
      throw failure;
    }),
  ).rejects.toBe(failure);
});
