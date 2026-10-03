import { expect, test } from "bun:test";
import { RecordingCapture } from "./recording-capture";

test("stop time excludes asynchronous data flushing and saving", async () => {
  let clock = 100;
  const capture = new RecordingCapture(() => clock);
  capture.add(new Blob(["first"]));
  clock = 5100;
  capture.stop();
  clock = 10100;
  capture.add(new Blob(["last"]));
  const result = capture.finish("audio/webm");
  expect(result?.durationMs).toBe(5000);
  expect(await result?.blob.text()).toBe("firstlast");
  expect(result?.blob.type).toBe("audio/webm");
  expect(capture.finish("audio/webm")).toBeNull();
});
test("error followed by data and stop cannot save a partial recording", () => {
  let clock = 0;
  const capture = new RecordingCapture(() => clock);
  capture.add(new Blob(["partial"]));
  clock = 5000;
  capture.fail();
  capture.add(new Blob(["final error data"]));
  expect(capture.finish("audio/webm")).toBeNull();
});
test("empty data and invalid duration never replace the previous recording", () => {
  for (const duration of [0, -1, NaN, Infinity, 500]) {
    let clock = 0;
    const capture = new RecordingCapture(() => clock);
    if (duration !== 500) capture.add(new Blob(["audio"]));
    clock = duration;
    const previous = { id: "previous valid recording" };
    let saved = previous;
    const result = capture.finish("audio/mp4");
    if (result) saved = { id: "new" };
    expect(result).toBeNull();
    expect(saved).toBe(previous);
  }
});
test("natural end of a recording preserves its MIME type and duration", () => {
  let clock = 0;
  const capture = new RecordingCapture(() => clock);
  capture.add(new Blob(["audio"]));
  clock = 3000;
  const result = capture.finish("audio/mp4");
  expect(result?.durationMs).toBe(3000);
  expect(result?.blob.type).toBe("audio/mp4");
});
