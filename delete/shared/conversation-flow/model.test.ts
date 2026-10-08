import { describe, expect, test } from "bun:test";
import {
  attachEvaluation,
  confirmTranscript,
  editTranscript,
  isEvaluation,
  makeReview,
  microphoneProblem,
  speechMeasurements,
  type Attempt,
} from "./model";

const attempt: Attempt = {
  id: "first",
  sessionId: "session",
  topicId: "en-a1-001",
  language: "en",
  createdAt: "2026-09-08T10:00:00Z",
  updatedAt: "2026-09-08T10:00:00Z",
  kind: "initial",
  task: "Introduce yourself.",
  contentVersion: "1",
  hintsUsed: [],
  audio: new Blob(["audio"]),
  captureState: "stopped",
  durationMs: 10000,
  rawTranscript: "He have two kids.",
  transcriptSource: "browser-asr",
  editedTranscript: "He have two kids.",
  errorNote: "",
  contrastNote: "",
};
const result = {
  original: attempt.editedTranscript,
  corrected: "He has two kids.",
  provider: "LanguageTool",
  checkedAt: "2026-09-08T10:01:00Z",
  issues: [
    {
      message: "Third person singular uses has.",
      offset: 3,
      length: 4,
      replacements: ["has"],
      category: "Agreement",
      ruleId: "agreement",
    },
  ],
};
describe("conversation evidence boundaries", () => {
  test("editing and confirming text cannot rewrite audio, recognition or speed", () => {
    const edited = confirmTranscript(
      editTranscript(attempt, "He has two children and he works in a shop."),
    );
    expect(edited.audio).toBe(attempt.audio);
    expect(edited.rawTranscript).toBe(attempt.rawTranscript);
    expect(speechMeasurements(edited)).toEqual(speechMeasurements(attempt));
    expect(speechMeasurements(edited).wordsPerMinute).toBe(24);
  });
  test("provider feedback requires confirmation and an exact transcript binding", () => {
    expect(() => attachEvaluation(attempt, result)).toThrow();
    const confirmed = confirmTranscript(attempt);
    expect(attachEvaluation(confirmed, result).evaluation?.provider).toBe(
      "LanguageTool",
    );
    expect(() =>
      attachEvaluation(confirmed, { ...result, original: "Another attempt" }),
    ).toThrow();
    const changed = editTranscript(
      attachEvaluation(confirmed, result),
      "He has two kids.",
    );
    expect(changed.evaluation).toBeUndefined();
    expect(changed.confirmedAt).toBeUndefined();
  });
  test("invalid and out-of-range provider matches are rejected", () => {
    for (const offset of [-1, 2.2, 999])
      expect(
        isEvaluation(
          { ...result, issues: [{ ...result.issues[0], offset }] },
          result.original,
        ),
      ).toBe(false);
    expect(
      isEvaluation(
        { ...result, issues: [{ ...result.issues[0], replacements: [null] }] },
        result.original,
      ),
    ).toBe(false);
  });
  test("manual transcription has no invented word-rate measurement", () => {
    expect(
      speechMeasurements({
        ...attempt,
        rawTranscript: "",
        transcriptSource: "unavailable",
        editedTranscript: "Many typed words.",
      }),
    ).toEqual({ words: null, wordsPerMinute: null });
  });
  test("scheduled fresh tasks do not complete reviews or contain prior answers", () => {
    const review = makeReview(attempt, 7, new Date("2026-09-08T10:00:00Z"));
    expect(review.dueAt).toBe("2026-09-15T10:00:00.000Z");
    expect(review.task).toContain("New situation");
    expect(review.task).not.toContain(attempt.editedTranscript);
    expect(review.completedAt).toBeUndefined();
    expect(review.responseId).toBeUndefined();
    expect(makeReview({ ...attempt, id: "retry" }, 7).id).toBe(review.id);
  });
  test("microphone failures are distinct from silence", () => {
    expect(microphoneProblem({ name: "NotAllowedError" })).toBe("blocked");
    expect(microphoneProblem({ name: "NotFoundError" })).toBe("missing");
    expect(microphoneProblem({ name: "NotReadableError" })).toBe("device");
  });
});
