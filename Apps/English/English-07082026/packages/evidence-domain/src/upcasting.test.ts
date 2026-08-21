import { describe, expect, test } from "bun:test";
import historicalV1 from "./fixtures/attempt-submitted-v1.json";
import expectedV2 from "./fixtures/attempt-submitted-v2.expected.json";
import { upcastToCurrent, type VersionedEventEnvelope } from "./upcasting";

describe("historical event upcasting", () => {
  test("matches the golden V2 snapshot and is deterministic", () => {
    const source = structuredClone(historicalV1) as VersionedEventEnvelope;
    const before = structuredClone(source);
    const first = upcastToCurrent(source);
    const second = upcastToCurrent(structuredClone(source));

    expect(first).toEqual(expectedV2);
    expect(second).toEqual(first);
    expect(source).toEqual(before);
  });

  test("does not manufacture speaking, pronunciation, or recall evidence", () => {
    const result = upcastToCurrent(historicalV1 as VersionedEventEnvelope) as VersionedEventEnvelope<{
      evidenceEligibility: Record<string, boolean | string>;
      response: { transcriptProvenance: string };
    }>;
    expect(result.payload.response.transcriptProvenance).toBe("legacy_unknown");
    expect(result.payload.evidenceEligibility.speaking).toBe(false);
    expect(result.payload.evidenceEligibility.pronunciation).toBe(false);
    expect(result.payload.evidenceEligibility.independentRecall).toBe(false);
  });

  test("returns current events unchanged and fails closed on missing chains", () => {
    expect(upcastToCurrent(expectedV2 as VersionedEventEnvelope)).toBe(expectedV2);
    expect(() =>
      upcastToCurrent({ ...historicalV1, eventVersion: "0.9.0" } as VersionedEventEnvelope),
    ).toThrow("Missing upcaster");
  });
});
