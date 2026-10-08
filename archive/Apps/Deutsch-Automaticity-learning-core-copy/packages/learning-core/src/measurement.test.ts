import { describe, expect, test } from "bun:test";
import {
  buildAttemptVerticalSlice,
  emptyLearningEvidenceLedger,
  mergeLearningEvidenceBundle,
} from "./index";
import {
  buildPrivacySafeMeasurementExport,
  captureMeasurementBaseline,
  DEFAULT_MEASUREMENT_DATA_CATEGORIES,
  deleteLocalMeasurementData,
  enforceMeasurementRetention,
  grantMeasurementConsent,
  MEASUREMENT_BASELINE_STORAGE_KEY,
  MEASUREMENT_CONSENT_STORAGE_KEY,
  MEASUREMENT_METRIC_DEFINITIONS,
  readMeasurementBaseline,
  readMeasurementConsent,
  revokeMeasurementConsent,
  validatePrivacySafeMeasurementExport,
  type MeasurementStorage,
  type PrivacySafeMeasurementExport,
} from "./measurement";

function createStorage(): MeasurementStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function createLedger() {
  const bundle = buildAttemptVerticalSlice({
    attemptId: "measurement-writing-1",
    occurredAt: "2026-08-22T09:05:00.000Z",
    language: "en",
    cefrLevel: "B1",
    contentVersion: "27.3.13-b1-runtime",
    topic: "Present perfect",
    mode: "writing",
    inputText: "I have finished the confidential assignment.",
    correctedText: "I have finished the confidential assignment.",
    targetHit: true,
    accuracyScore: 96,
    attemptVerified: true,
    assessedBy: "online",
    sessionMinutes: 30,
  });
  return mergeLearningEvidenceBundle(emptyLearningEvidenceLedger(), bundle);
}

function grantAndCapture(storage: MeasurementStorage, withLedger = true) {
  grantMeasurementConsent(storage, {
    id: "consent-1",
    participantId: "participant-local-1",
    grantedAt: "2026-08-22T09:00:00.000Z",
  });
  return captureMeasurementBaseline(storage, {
    id: "baseline-1",
    capturedAt: "2026-08-22T09:01:00.000Z",
    language: "en",
    appVersion: "27.3.13",
    sessionMinutes: 30,
    interventionFlags: { experimentalScheduling: false, aiIntervention: false },
    ledger: withLedger ? createLedger() : emptyLearningEvidenceLedger(),
  });
}

describe("Gate G2 measurement contract", () => {
  test("consent names its purpose, categories, policy version, and revocation", () => {
    const storage = createStorage();
    const consent = grantMeasurementConsent(storage, {
      id: "consent-1",
      participantId: "participant-local-1",
      grantedAt: "2026-08-22T09:00:00.000Z",
    });

    expect(consent.purpose).toBe("product-effectiveness-research");
    expect(consent.dataCategories).toEqual(DEFAULT_MEASUREMENT_DATA_CATEGORIES);
    expect(consent.status).toBe("granted");
    expect(consent.revokedAt).toBeNull();

    const revoked = revokeMeasurementConsent(
      storage,
      "2026-08-22T10:00:00.000Z",
    );
    expect(revoked?.status).toBe("revoked");
    expect(revoked?.revokedAt).toBe("2026-08-22T10:00:00.000Z");
  });

  test("baseline is impossible before consent or after an intervention starts", () => {
    const storage = createStorage();
    const input = {
      id: "baseline-1",
      capturedAt: "2026-08-22T09:01:00.000Z",
      language: "de" as const,
      appVersion: "20.8.23",
      sessionMinutes: 15 as const,
      interventionFlags: { experimentalScheduling: false },
      ledger: emptyLearningEvidenceLedger(),
    };

    expect(captureMeasurementBaseline(storage, input)).toEqual({
      status: "unavailable",
      reason: "consent-required",
    });

    grantMeasurementConsent(storage, {
      id: "consent-1",
      participantId: "participant-local-1",
      grantedAt: "2026-08-22T09:00:00.000Z",
    });
    expect(
      captureMeasurementBaseline(storage, {
        ...input,
        interventionFlags: { experimentalScheduling: true },
      }),
    ).toEqual({
      status: "unavailable",
      reason: "intervention-already-enabled",
    });
  });

  test("privacy-safe export contains identifiers and scores but no raw response", () => {
    const storage = createStorage();
    expect(grantAndCapture(storage).status).toBe("captured");
    const result = buildPrivacySafeMeasurementExport({
      language: "en",
      appVersion: "27.3.13",
      exportedAt: "2026-08-22T09:10:00.000Z",
      storage,
      ledger: createLedger(),
    });

    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const serialized = JSON.stringify(result.data);
    expect(result.data.events).toHaveLength(2);
    expect(result.data.outcomes[0]?.accuracyScore).toBe(96);
    expect(serialized).not.toContain("confidential assignment");
    expect(serialized).not.toContain("inputText");
    expect(serialized).not.toContain("correctedText");
    expect(serialized).not.toContain("transcript");
    expect(serialized).not.toContain("audio");
    expect(result.data.cohortStatistics).toEqual({
      status: "not-computed",
      reason: "production-telemetry-unavailable",
    });
    expect(
      validatePrivacySafeMeasurementExport(
        result.data,
        "2026-08-22T09:11:00.000Z",
      ).status,
    ).toBe("passed");
  });

  test("stored consent and baseline are projected onto allowlisted fields", () => {
    const storage = createStorage();
    grantAndCapture(storage, false);
    const consent = JSON.parse(
      storage.getItem(MEASUREMENT_CONSENT_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    const baseline = JSON.parse(
      storage.getItem(MEASUREMENT_BASELINE_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    storage.setItem(
      MEASUREMENT_CONSENT_STORAGE_KEY,
      JSON.stringify({ ...consent, secretNote: "do not export" }),
    );
    storage.setItem(
      MEASUREMENT_BASELINE_STORAGE_KEY,
      JSON.stringify({ ...baseline, privateProfile: "do not export" }),
    );

    const result = buildPrivacySafeMeasurementExport({
      language: "en",
      appVersion: "27.3.13",
      exportedAt: "2026-08-22T09:10:00.000Z",
      storage,
      ledger: emptyLearningEvidenceLedger(),
    });
    expect(result.status).toBe("ready");
    expect(JSON.stringify(result)).not.toContain("do not export");
    expect(JSON.stringify(result)).not.toContain("secretNote");
    expect(JSON.stringify(result)).not.toContain("privateProfile");
  });

  test("quality checks catch duplicate IDs, version/time errors, and raw leakage", () => {
    const storage = createStorage();
    grantAndCapture(storage);
    const result = buildPrivacySafeMeasurementExport({
      language: "en",
      appVersion: "27.3.13",
      exportedAt: "2026-08-22T09:10:00.000Z",
      storage,
      ledger: createLedger(),
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const first = result.data.events[0];
    expect(first).toBeDefined();
    const unsafe = {
      ...result.data,
      events: [first, { ...first, transcript: "raw learner speech" }],
      baseline: {
        ...result.data.baseline,
        capturedAt: "2026-08-22T08:59:00.000Z",
      },
    } as unknown as PrivacySafeMeasurementExport;
    const report = validatePrivacySafeMeasurementExport(
      unsafe,
      "2026-08-22T09:11:00.000Z",
    );

    expect(report.status).toBe("failed");
    expect(report.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "duplicate-event-id",
        "invalid-time-version-contract",
        "prohibited-raw-field",
      ]),
    );
  });

  test("missing outcomes remain first-class N/A and never become a success rate", () => {
    const storage = createStorage();
    grantAndCapture(storage, false);
    const result = buildPrivacySafeMeasurementExport({
      language: "en",
      appVersion: "27.3.13",
      exportedAt: "2026-08-22T09:10:00.000Z",
      storage,
      ledger: emptyLearningEvidenceLedger(),
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const report = validatePrivacySafeMeasurementExport(
      result.data,
      "2026-08-22T09:11:00.000Z",
    );
    expect(report.status).toBe("insufficient-data");
    expect(report.sampleSize).toBe(0);
    expect(report.findings[0]?.message).toContain("N/A");
  });

  test("engagement and learning metrics remain explicitly separated", () => {
    const byId = new Map(
      MEASUREMENT_METRIC_DEFINITIONS.map((definition) => [
        definition.id,
        definition,
      ]),
    );
    expect(byId.get("return_after_gap_rate")?.metricClass).toBe("engagement");
    expect(byId.get("false_positive_rate")?.humanLabelsRequired).toBe(true);
    expect(byId.get("novel_transfer_rate")?.metricClass).toBe(
      "learning-outcome",
    );
  });

  test("delete removes only measurement consent and baseline records", () => {
    const storage = createStorage();
    grantAndCapture(storage);
    storage.setItem("unrelated-learning-backup", "keep-me");

    deleteLocalMeasurementData(storage);

    expect(readMeasurementConsent(storage)).toBeNull();
    expect(readMeasurementBaseline(storage)).toBeNull();
    expect(storage.getItem(MEASUREMENT_CONSENT_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(MEASUREMENT_BASELINE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("unrelated-learning-backup")).toBe("keep-me");
  });

  test("the documented 365-day local retention limit is enforced", () => {
    const storage = createStorage();
    grantMeasurementConsent(storage, {
      id: "consent-old",
      participantId: "participant-old",
      grantedAt: "2025-01-01T00:00:00.000Z",
    });
    storage.setItem(MEASUREMENT_BASELINE_STORAGE_KEY, "old-baseline");
    storage.setItem("unrelated-learning-backup", "keep-me");

    expect(
      enforceMeasurementRetention(storage, "2026-01-02T00:00:00.001Z"),
    ).toBe(true);
    expect(readMeasurementConsent(storage)).toBeNull();
    expect(storage.getItem(MEASUREMENT_BASELINE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem("unrelated-learning-backup")).toBe("keep-me");
  });
});
