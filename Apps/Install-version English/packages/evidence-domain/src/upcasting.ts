export interface VersionedEventEnvelope<TPayload = unknown> {
  readonly eventId: string;
  readonly streamId: string;
  readonly sequence: number;
  readonly eventType: string;
  readonly eventVersion: string;
  readonly occurredAt: string;
  readonly payload: TPayload;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface AttemptSubmittedV1 {
  readonly attemptId: string;
  readonly taskId: string;
  readonly inputText: string;
  readonly mode: "writing" | "speaking" | "transfer";
}

export interface AttemptSubmittedV2 {
  readonly attemptId: string;
  readonly taskId: string;
  readonly taskVersion: string | null;
  readonly response: {
    readonly text: string;
    readonly transcriptProvenance: "legacy_unknown" | "raw_asr" | "reviewed" | "typed";
  };
  readonly mode: "writing" | "speaking" | "transfer";
  readonly evidenceEligibility: {
    readonly speaking: false;
    readonly pronunciation: false;
    readonly independentRecall: false;
    readonly reason: "legacy_provenance_unknown";
  };
}

export type Upcaster = (
  event: VersionedEventEnvelope,
) => VersionedEventEnvelope;

function upcastAttemptSubmittedV1ToV2(
  event: VersionedEventEnvelope,
): VersionedEventEnvelope<AttemptSubmittedV2> {
  const payload = event.payload as AttemptSubmittedV1;
  return Object.freeze({
    ...event,
    eventVersion: "2.0.0",
    payload: Object.freeze({
      attemptId: payload.attemptId,
      taskId: payload.taskId,
      taskVersion: null,
      response: Object.freeze({
        text: payload.inputText,
        transcriptProvenance: "legacy_unknown" as const,
      }),
      mode: payload.mode,
      evidenceEligibility: Object.freeze({
        speaking: false as const,
        pronunciation: false as const,
        independentRecall: false as const,
        reason: "legacy_provenance_unknown" as const,
      }),
    }),
  });
}

const registry = new Map<string, Upcaster>([
  ["attempt.submitted@1.0.0", upcastAttemptSubmittedV1ToV2],
]);

const currentVersions: Readonly<Record<string, string>> = Object.freeze({
  "attempt.submitted": "2.0.0",
});

export function upcastToCurrent(
  storedEvent: VersionedEventEnvelope,
): VersionedEventEnvelope {
  let current = storedEvent;
  const seen = new Set<string>();
  const targetVersion = currentVersions[current.eventType];
  if (!targetVersion) {
    return current;
  }

  while (current.eventVersion !== targetVersion) {
    const stepKey = `${current.eventType}@${current.eventVersion}`;
    if (seen.has(stepKey)) {
      throw new Error(`Upcaster cycle detected at ${stepKey}`);
    }
    seen.add(stepKey);
    const upcaster = registry.get(stepKey);
    if (!upcaster) {
      throw new Error(`Missing upcaster: ${stepKey} -> ${targetVersion}`);
    }
    const next = upcaster(current);
    if (next.eventType !== current.eventType || next.eventVersion === current.eventVersion) {
      throw new Error(`Invalid upcaster result for ${stepKey}`);
    }
    current = next;
  }

  return current;
}
