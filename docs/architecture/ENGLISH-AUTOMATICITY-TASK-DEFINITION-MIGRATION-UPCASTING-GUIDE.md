# English Automaticity: Task Definition Migration and Upcasting Guide

Status: architecture contract and release checklist  
Applies to: English Automaticity task definitions, evidence events, assessments, backfills, and skill-status projections  
Primary rule: preserve historical truth; never manufacture stronger evidence during migration

## 1. Purpose

This guide defines how to evolve `TaskDefinition` and evidence schemas without rewriting the immutable event history, losing learner data, or creating service downtime. It covers:

- versioned and immutable task definitions;
- blue/green deployment of code, configuration, task catalogs, and projections;
- environment-variable and secret changes;
- rollback of incompatible task, schema, rubric, and status-rule changes;
- deterministic on-read upcasting from legacy event versions;
- safe structural, assessment, projection, and content-linkage backfills;
- historical-event snapshot testing;
- an environment-by-environment definition change log.

This is an architecture and release contract. It does not authorize a migration by itself.

## 2. Non-negotiable invariants

1. A published task definition is immutable. A change produces a new version.
2. Every attempt remains bound to its original `taskId + taskVersion`.
3. Raw audio, original written responses, and stored events are append-only or immutable.
4. An upcaster changes the representation supplied to current code; it does not rewrite the event store.
5. A semantic change is not disguised as a structural upcast.
6. Missing historical facts stay missing. Migration must not infer audio, speech onset, active speech, pronunciation, transfer, or independence.
7. Assessments are append-only and identify provider, algorithm, rubric, input hash, and version.
8. Skill status is a rebuildable projection, not a stored truth such as `automatic: true`.
9. Blue and green must be able to read the same event history safely throughout the traffic-shift window.
10. Rollback switches code, config, task resolution, or projections; it never deletes newly appended learner events.
11. Backfill creates traceable derived records from real historical inputs; it never upgrades unknown provenance into trusted evidence.
12. Install, Update, Repair, rollback, and backfill must preserve learner history and user-owned audio.

The event store remains the source of truth. Microsoft describes tolerant deserialization, event versioning, and chained upcasters as ways to evolve immutable events, while treating in-place rewriting as a last resort because it damages the audit trail: [Event Sourcing pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/event-sourcing).

## 3. Version model

Keep these versions independent:

| Version | Controls | Example |
|---|---|---|
| `appVersion` | runtime code and UI | `3.5.0` |
| `eventSchemaVersion` | persisted event envelope/payload | `2.0.0` |
| `taskVersion` | prompt, modality, help, timer, and task semantics | `2.1.0` |
| `contentVersion` | lesson text, scenarios, examples, and audio | `a2-work-1.4.0` |
| `rubricVersion` | assessment criteria | `speaking-a2-1.2.0` |
| `assessmentAlgorithmVersion` | metric/provider calculation | `fluency-0.9.0` |
| `statusRuleVersion` | evidence-to-status projection rules | `automaticity-2.0.0` |
| `taskCatalogVersion` | exact set of published definitions | `2026.08.14.1` |
| `configBundleVersion` | non-secret runtime configuration | `cfg-2026.08.14.2` |
| `installerVersion` | Install/Update/Repair payload | `3.5.0+installer.1` |

Use Semantic Versioning for public contracts: incompatible changes increment MAJOR, backward-compatible additions increment MINOR, and backward-compatible fixes increment PATCH. Released versions must not be modified: [Semantic Versioning 2.0.0](https://semver.org/).

### 3.1 Change classification

| Change | Version/action | Historical evidence |
|---|---|---|
| Typo only; no meaning change | task/content PATCH | unchanged |
| Optional metadata or hint | task/content MINOR | unchanged if help policy is compatible |
| Optional event field | schema MINOR + tolerant reader/upcaster | unchanged |
| Rename/remove/change meaning of field | schema MAJOR + upcaster or new event type | preserved; compatibility evaluated |
| Guided task becomes independent | task MAJOR / semantic successor | old evidence remains guided |
| Reference moves from before response to after submit | task MAJOR | old recall is practice/history only |
| Add audio, VAD, or pronunciation requirement | rule MAJOR; possibly task MAJOR | old evidence needs reassessment or new attempt |
| Generic writing transfer becomes spoken follow-up transfer | semantic successor | old evidence cannot qualify as new transfer |
| Fix arithmetic bug in fluency metric | algorithm PATCH + new assessment | original assessment retained |
| Add Day-30 retention requirement | status-rule MAJOR | projection rebuilt; raw evidence unchanged |

## 4. Required event envelope

```ts
interface VersionedEventEnvelope<TPayload = unknown> {
  eventId: string;
  streamId: string;
  sequence: number;
  eventType: string;
  eventVersion: string;
  occurredAt: string;
  payload: TPayload;
  metadata: {
    appVersion: string;
    taskCatalogVersion?: string;
    correlationId?: string;
    causationId?: string;
    producer?: string;
  };
}
```

Ordering is determined by the stream sequence, not wall-clock timestamps. Consumers must be idempotent because event delivery may occur more than once.

## 5. Blue/green target architecture

```text
                         traffic router
                        /              \
             BLUE: current          GREEN: candidate
             app + readers          app + readers
             config bundle B        config bundle G
             task catalog B         task catalog G
                    \                 /
                     immutable event store
                    /                 \
       blue projection namespace   green shadow namespace
```

The green environment is created beside blue, validated, and then receives traffic. Keeping blue alive makes traffic rollback fast; this matches the blue/green model documented for AWS CodeDeploy, where the replacement environment is tested before traffic is rerouted and rollback routes traffic back to the original task set: [AWS CodeDeploy](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html), [ECS deployment workflow](https://docs.aws.amazon.com/codedeploy/latest/userguide/deployment-steps-ecs.html).

### 5.1 Isolation rules

- Blue and green share immutable raw history only when both readers are proven compatible.
- Green writes events in the new schema only after blue can safely tolerate them, or writes must remain disabled during shadow validation.
- Green uses a separate projection namespace: for example, `skill-status-v2-green`.
- Task catalog and rule registry are addressed by immutable version/digest, never `latest`.
- Each environment carries a release manifest containing code commit, image/build digest, task catalog, schemas, rules, config digest, and secret references.
- Health checks cover exact historical task resolution and event replay, not only HTTP liveness.

### 5.2 Zero-downtime compatibility rule

During the overlap window:

```text
new writer output must be readable by old reader
AND
old writer output must be readable by new reader
```

If that cannot be achieved, use two releases:

1. **Expand release:** deploy tolerant readers, optional fields, dual-read, and shadow projections.
2. **Contract release:** only after all old instances are gone, require the new fields and retire old writes.

## 6. Blue/green migration checklist

### Phase 0 — Inventory and freeze

- [ ] Assign a unique `changeId` and owner.
- [ ] Freeze the exact task catalog, code commit, schemas, rules, and installer baseline.
- [ ] Export a read-only inventory by `eventType/eventVersion` and `taskId/taskVersion`.
- [ ] Count audio present, audio deleted, typed transcripts, unknown transcripts, and incomplete assessments.
- [ ] Record current projection counts and status distribution.
- [ ] Capture input manifest hashes and backup references.
- [ ] Classify the change as structural, task/content, semantic, assessment, projection, or configuration.
- [ ] Define the rollback target before deployment starts.
- [ ] Confirm no migration requires fabricating missing provenance.

### Phase 1 — Compatibility preparation

- [ ] Add tolerant readers or the required upcaster chain to blue first.
- [ ] Keep old task definitions resolvable by exact version.
- [ ] Publish, never overwrite, new task definitions.
- [ ] Add new fields as optional until the contract release.
- [ ] Add a green projection namespace and independent checkpoint.
- [ ] Ensure handlers are idempotent and resume from stable sequence/checkpoint values.
- [ ] Ensure snapshots declare the event position and the versions used to build them.
- [ ] Reject startup when a required upcaster or exact task version is missing.

### Phase 2 — Build green

- [ ] Deploy the candidate code with immutable build/image digest.
- [ ] Pin task catalog, status rules, rubric, algorithm, config bundle, and secrets by version.
- [ ] Run startup configuration validation before marking green healthy.
- [ ] Replay historical fixture streams through the full upcaster chain.
- [ ] Build shadow projections from the event store or a verified snapshot plus tail events.
- [ ] Compare green shadow counts, hashes, rejection reasons, and status deltas with blue.
- [ ] Keep user traffic at zero until all mandatory checks pass.

### Phase 3 — Pre-traffic validation

- [ ] Validate new-attempt resolution uses the latest published non-deprecated task.
- [ ] Validate historical-attempt resolution uses the exact archived task version.
- [ ] Confirm blue can read any event that green may append during overlap.
- [ ] Confirm green can read all blue event versions.
- [ ] Run provider-unavailable, missing-audio, deleted-artifact, and offline-resume cases.
- [ ] Verify a typed transcript cannot become speaking evidence.
- [ ] Verify a semantic successor does not inherit predecessor eligibility.
- [ ] Verify no self-rating, completion, or word count can produce Automatic status.
- [ ] Verify metrics and projection output are deterministic for a fixed `asOf`.

### Phase 4 — Traffic shift

- [ ] Send internal/test traffic to green.
- [ ] If supported, shift a small canary percentage before full cutover.
- [ ] Monitor error rate, latency, provider failure, replay failures, projection lag, and blue/green status mismatch.
- [ ] Stop automatically if a rollback threshold is crossed.
- [ ] Record each traffic percentage and timestamp in the change log.
- [ ] Keep blue and its projection untouched until the observation window ends.

### Phase 5 — Cutover and stabilization

- [ ] Move production traffic to green only after the acceptance gate passes.
- [ ] Make the validated green projection the primary read model by an atomic alias/pointer switch.
- [ ] Keep the blue projection available for comparison and rapid rollback.
- [ ] Keep dual-read for at least one full release cycle.
- [ ] Disable legacy writes only in a later contract release.
- [ ] Rebuild and verify the local Install/Update/Repair path when app payloads change.
- [ ] Retire blue only after the rollback window and data-preservation checks pass.

## 7. Environment-variable and secret changes

Environment variables are process-start configuration. Updating their source does not update a running process; Kubernetes explicitly notes that Pods consuming ConfigMap values as environment variables require a rollout and that failing to roll all Pods can leave mixed old/new values: [Updating configuration via a ConfigMap](https://kubernetes.io/docs/tutorials/configuration/updating-configuration-via-a-configmap/).

### 7.1 Rules

1. Treat config as a versioned deployment input, not an out-of-band mutable value.
2. Give each config bundle an immutable name or digest.
3. Pin secrets to a secret version or stage where the platform permits it.
4. Never store secret values in a release manifest, task definition change log, logs, or screenshots.
5. Introduce renamed variables in an additive release: read `NEW_NAME`, fall back to `OLD_NAME`, deploy, migrate configuration, then remove the fallback later.
6. Do not change a variable's meaning in place. Create a new variable name.
7. Validate type, range, URL shape, and required combinations at startup.
8. Blue retains its own config and secret references; green receives new references.
9. A secret rotation that is injected as an environment variable requires replacement tasks/processes. AWS likewise requires a new task or forced deployment for updated injected secret values: [ECS Secrets Manager environment variables](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html).
10. Non-secret environment variables may be visible through platform APIs; secrets belong in the platform secret store, not plain task-definition environment fields: [ECS environment variables](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/taskdef-envfiles.html).

### 7.2 Environment-variable change checklist

- [ ] Variable name and semantic meaning documented.
- [ ] Classification recorded: required, optional, secret, feature flag, endpoint, threshold, or compatibility switch.
- [ ] Default is explicit; security-sensitive settings fail closed.
- [ ] Blue behavior with old value verified.
- [ ] Green behavior with new value verified.
- [ ] Mixed-version overlap behavior verified.
- [ ] Startup validation and a non-secret config digest exposed in diagnostics.
- [ ] Secret access follows least privilege; no secret value appears in diagnostics.
- [ ] Rollback value/reference exists and was tested.
- [ ] Process replacement/rollout is included in the deployment plan.
- [ ] Removal of the old variable is scheduled for a later contract release.

## 8. Rollback without downtime

Rollback is a forward operational action. It creates a new deployment record and switches traffic or aliases; it does not pretend that newly appended events never happened.

### 8.1 Rollback matrix

| Failure | Immediate rollback | Data action |
|---|---|---|
| Green health/startup failure | keep traffic on blue | retain green logs; no event change |
| Config/secret incompatibility | switch traffic to blue config/runtime | create corrected config version; never edit manifest in place |
| New task definition is flawed | point new-attempt resolver to prior published task | deprecate/block flawed version; historical attempts remain exact-version readable |
| Green projection incorrect | switch read alias to blue projection | discard/rebuild green projection; event store unchanged |
| Upcaster bug | route to blue reader | deploy fixed upcaster and replay fixtures/history |
| New event unreadable by blue | stop green writes/traffic immediately | deploy compatibility reader forward; do not rewrite event history |
| Status rule causes unsafe downgrades | restore previous status-rule alias/projection | keep shadow projection and explanations for audit |
| Domain event contained wrong fact | use domain-approved compensating event | never silently change original event |
| Backfill generated invalid derived records | stop run and exclude outputs by `backfillRunId` | append rollback/superseded ledger events; preserve audit history |

### 8.2 Rollback runbook

1. Freeze traffic shift and pause green writers/backfill workers.
2. Record incident time, traffic percentage, last green sequence, projection checkpoint, and config/task/rule versions.
3. Route traffic to blue or switch the read alias to the last-known-good projection.
4. Confirm blue can read every event appended during the green window.
5. If blue cannot read them, deploy a compatibility-reader hotfix before restoring normal writes.
6. Mark flawed task versions `blocked` or `deprecated`; do not delete them.
7. Mark derived backfill/assessment records superseded by append-only ledger entries.
8. Reconcile event counts and projection checkpoints.
9. Run smoke, historical-resolution, and user-data preservation checks.
10. Record rollback as a new deployment/change-log entry with its own ID.

## 9. Upcasting architecture

An upcaster transforms an old serialized representation into the next representation during read/deserialization. Upcasters are chained incrementally, allowing the domain code to handle only the latest version while the stored event remains untouched. This is the model documented by Axon: [Event Versioning](https://docs.axoniq.io/axon-framework-reference/main/events/event-versioning/).

```text
immutable Event V1 in store
        ↓ deserialize envelope only
V1 → V1.1 pure upcaster
        ↓
V1.1 → V2 pure upcaster
        ↓ validate current schema
current V2 domain event
        ↓
aggregate/projection handler
```

### 9.1 Pure-function contract

An upcaster may use only:

- the source payload and envelope metadata;
- compile-time/versioned constants that are part of the upcaster release;
- deterministic parsing and transformation.

An upcaster must not use:

- `Date.now()` or current time;
- random IDs or `crypto.randomUUID()`;
- network calls, provider APIs, databases, file discovery, or mutable configuration;
- current task definitions to reinterpret a historical attempt;
- user locale or machine timezone;
- guessed provenance or fabricated educational evidence.

### 9.2 TypeScript example: V1 to V2

```ts
type AttemptSubmittedV1 = {
  id: string;
  taskId: string;
  transcript?: string;
  audioId?: string;
  completedAt: string;
};

type AttemptSubmittedV2 = {
  attemptId: string;
  taskId: string;
  taskVersion: "0.0.0-legacy";
  submittedAt: string;
  audioArtifactId?: string;
  legacyTranscript?: {
    text: string;
    provenance: "legacy_unknown";
    eligibleForRawSpeechAssessment: false;
  };
};

export function upcastAttemptSubmittedV1ToV2(
  event: VersionedEventEnvelope<AttemptSubmittedV1>,
): VersionedEventEnvelope<AttemptSubmittedV2> {
  if (event.eventType !== "AttemptSubmitted" || event.eventVersion !== "1.0.0") {
    throw new Error("Unexpected source event for AttemptSubmitted 1.0.0→2.0.0");
  }

  const source = event.payload;
  return {
    ...event,
    eventVersion: "2.0.0",
    payload: {
      attemptId: source.id,
      taskId: source.taskId,
      taskVersion: "0.0.0-legacy",
      submittedAt: source.completedAt,
      audioArtifactId: source.audioId,
      legacyTranscript: source.transcript
        ? {
            text: source.transcript,
            provenance: "legacy_unknown",
            eligibleForRawSpeechAssessment: false,
          }
        : undefined,
    },
  };
}
```

This deliberately does not rename the old transcript to `rawTranscript`, infer active speech from recording duration, or invent pronunciation/transfer results.

### 9.3 Registry and chain

```ts
type AnyEnvelope = VersionedEventEnvelope<unknown>;
type EventUpcaster = (event: AnyEnvelope) => AnyEnvelope;

interface UpcasterStep {
  eventType: string;
  fromVersion: string;
  toVersion: string;
  transform: EventUpcaster;
}

const registry: readonly UpcasterStep[] = [
  {
    eventType: "AttemptSubmitted",
    fromVersion: "1.0.0",
    toVersion: "2.0.0",
    transform: upcastAttemptSubmittedV1ToV2 as EventUpcaster,
  },
];

export function upcastToCurrent(
  input: AnyEnvelope,
  targetVersion: string,
): AnyEnvelope {
  let current = structuredClone(input);
  const visited = new Set<string>();

  while (current.eventVersion !== targetVersion) {
    const key = `${current.eventType}@${current.eventVersion}`;
    if (visited.has(key)) throw new Error(`Upcaster cycle detected at ${key}`);
    visited.add(key);

    const step = registry.find(
      (candidate) =>
        candidate.eventType === current.eventType &&
        candidate.fromVersion === current.eventVersion,
    );
    if (!step) throw new Error(`Missing upcaster for ${key}`);

    current = step.transform(current);
    if (current.eventVersion !== step.toVersion) {
      throw new Error(`Upcaster ${key} returned an unexpected version`);
    }
  }

  return current;
}
```

### 9.4 Structural versus semantic evolution

Use an upcaster for representation-compatible evolution:

- field rename with known meaning;
- optional field with a safe explicit default;
- nesting/shape change;
- stable type/package rename;
- normalizing a legacy version marker.

Do not use an upcaster to claim a new domain fact:

- guided becomes independent;
- typed text becomes speaking;
- recording duration becomes active speech;
- generic prompt becomes transfer;
- missing audio gains pronunciation;
- an old task attempt moves to a semantic successor.

For semantic evolution, publish a new task/event and record explicit lineage or a compensating/domain event.

## 10. Snapshot and historical-event testing

Snapshots are an optimization, not the source of truth. They must be disposable and rebuildable from the event stream. A snapshot must identify:

```ts
interface ProjectionSnapshot<TState> {
  snapshotVersion: string;
  projectionName: string;
  projectionCodeVersion: string;
  statusRuleVersion?: string;
  lastEventSequence: number;
  state: TState;
  stateHash: string;
  createdAt: string;
}
```

### 10.1 Historical fixture layout

```text
tests/fixtures/events/
  attempt-submitted-v1/
    input.json
    expected-v2.json
  mixed-stream-v1-v2/
    events.jsonl
    expected-projection.json
  missing-audio-legacy/
    events.jsonl
    expected-rejections.json
  semantic-successor-history-only/
    events.jsonl
    expected-projection.json
```

Fixtures must be de-identified copies or carefully constructed equivalents of real historical shapes. Never commit learner audio, transcript, personal identifiers, secrets, or provider tokens.

### 10.2 Mandatory tests

- **Golden transformation:** V1 fixture exactly matches the reviewed V2 JSON.
- **Determinism:** the same input produces byte-equivalent canonical output across repeated runs.
- **Input immutability:** the input object/bytes remain unchanged.
- **Chain equivalence:** `V1→V1.1→V2` matches the approved direct current representation.
- **Version guard:** current V2 events are not re-upcast.
- **Missing-step failure:** an unknown version fails closed with event ID/type/version in the error.
- **No fake provenance:** unknown transcript remains `legacy_unknown` and cannot qualify as raw speaking evidence.
- **Mixed-stream replay:** V1 and V2 events rebuild the same expected aggregate/projection.
- **Ordering:** replay respects stream sequence, not file order or timestamp alone.
- **Duplicate delivery:** projection handlers remain idempotent.
- **Snapshot equivalence:** full replay equals snapshot-plus-tail replay.
- **Snapshot invalidation:** incompatible snapshot/rule versions are discarded and rebuilt.
- **Exact historical task resolution:** historical attempt opens the archived exact task version.
- **Property/fuzz tests:** missing optional fields, extra unknown fields, Unicode, boundary numbers, and malformed payloads fail or default exactly as specified.
- **Performance:** representative long streams remain inside the replay budget.

### 10.3 Example Bun tests

```ts
import { describe, expect, test } from "bun:test";

describe("AttemptSubmitted 1.0.0→2.0.0", () => {
  test("is deterministic and does not mutate its input", () => {
    const input = structuredClone(attemptV1Fixture);
    const frozenCopy = structuredClone(input);

    const first = upcastAttemptSubmittedV1ToV2(input);
    const second = upcastAttemptSubmittedV1ToV2(input);

    expect(first).toEqual(second);
    expect(input).toEqual(frozenCopy);
    expect(first).toEqual(expectedAttemptV2Fixture);
  });

  test("does not invent speaking provenance", () => {
    const output = upcastAttemptSubmittedV1ToV2(attemptV1Fixture);
    expect(output.payload.legacyTranscript?.provenance).toBe("legacy_unknown");
    expect(
      output.payload.legacyTranscript?.eligibleForRawSpeechAssessment,
    ).toBe(false);
  });
});
```

## 11. Safe backfill strategy

Backfill means deriving new traceable records from historical inputs, not converting old activity into stronger evidence.

### 11.1 Backfill kinds

| Kind | Allowed output | Forbidden inference |
|---|---|---|
| Structural | explicit task version, legacy provenance, normalized shape | guessed historical version |
| Artifact | hash/duration/metadata for an existing artifact | reconstructed audio |
| Assessment | new VAD/STT/pronunciation result from real retained audio | score without source audio |
| Projection | shadow status from current rules | overwriting raw history |
| Content linkage | predecessor/successor/compatibility link | moving an attempt to a semantic successor |

### 11.2 Backfill control record

```ts
interface BackfillRun {
  backfillRunId: string;
  kind: "structural" | "artifact" | "assessment" | "projection" | "content_linkage";
  sourceRange: Record<string, unknown>;
  inputSchemaVersion: string;
  outputSchemaVersion: string;
  taskCatalogVersion: string;
  statusRuleVersion?: string;
  assessmentAlgorithmVersion?: string;
  rubricVersion?: string;
  codeCommit: string;
  appVersion: string;
  mode: "dry_run" | "shadow" | "apply";
  status: "planned" | "running" | "paused" | "completed" | "completed_with_errors" | "failed" | "rolled_back";
  checkpoint?: { partition: string; lastStableKey: string };
  counters: { scanned: number; created: number; skipped: number; failed: number; requiresUserAction: number };
  inputManifestHash: string;
  outputManifestHash?: string;
}
```

The output identity must include `backfillRunId + sourceArtifactId + target algorithm/rubric version` so retries cannot create duplicates.

### 11.3 Backfill checklist

- [ ] Inventory is read-only and includes deleted/unknown provenance categories.
- [ ] Dry run produces counts and a manifest without production writes.
- [ ] Historical attempts without a provable version keep `taskVersion = null` plus `legacy_unknown` provenance; a valid SemVer is never guessed.
- [ ] Typed/unknown transcripts remain ineligible for audio-based speaking.
- [ ] Assessment backfill runs only on real, checksum-verified audio.
- [ ] Consent and provider-purpose rules allow reprocessing.
- [ ] Output assessments are append-only and retain the source artifact hash.
- [ ] Jobs are partitioned, rate-limited, checkpointed, resumable, and idempotent.
- [ ] An item failure does not abort unrelated items; every failure is recorded.
- [ ] Shadow projections are written to a separate namespace.
- [ ] Delta is classified as unchanged, upgraded, downgraded, requires reassessment, or history only.
- [ ] Every downgrade/reassessment has a clear learner-facing explanation.
- [ ] Reconciliation proves `scanned = created + skipped + failed + pending consent`.
- [ ] Rollback excludes/supersedes outputs by run ID without deleting the audit trail.

## 12. Definition change log template

Copy one block per change. Never place secret values in this file.

```md
## Change: <CHANGE-ID> — <short title>

Owner: <name/team>
Risk: low | medium | high | critical
Change type: structural | task-content | semantic | assessment | projection | config | secret | backfill
Requested window: <UTC start/end>

### Contract versions

| Contract | From | To | Compatibility |
|---|---|---|---|
| App | | | |
| Event schema | | | |
| Task | | | |
| Content | | | |
| Rubric | | | |
| Assessment algorithm | | | |
| Status rule | | | |
| Task catalog | | | |
| Config bundle | | | |
| Installer | | | |

### Environment ledger

| Environment | Blue release/digest | Green release/digest | Config digest | Secret version refs | Task catalog | Projection namespace/checkpoint | Verification result | Traffic | Approved by | Timestamp |
|---|---|---|---|---|---|---|---|---:|---|---|
| Local/dev | | | | | | | | 0% | | |
| Test | | | | | | | | 0% | | |
| Staging | | | | | | | | 0% | | |
| Production | | | | | | | | 0% | | |

### Compatibility and migration

- Historical event versions in scope:
- Historical task versions in scope:
- Upcaster chain:
- Tolerant-reader/dual-read behavior:
- Dual-write behavior and removal release:
- Backfill run ID/mode:
- Shadow projection comparison:
- Learner-visible status changes:
- Data/provenance that must remain unknown:

### Acceptance gates

- [ ] historical replay
- [ ] exact task resolution
- [ ] deterministic upcasting
- [ ] no fake provenance
- [ ] blue/green overlap compatibility
- [ ] config/secret startup validation
- [ ] shadow projection reconciliation
- [ ] provider-unavailable behavior
- [ ] user-data preservation
- [ ] Install/Update/Repair when applicable

### Traffic log

| Time UTC | Blue % | Green % | Error rate | Projection mismatch | Decision/operator |
|---|---:|---:|---:|---:|---|
| | 100 | 0 | | | |

### Rollback

Rollback target release:
Rollback config/task/rule versions:
Traffic/read-alias procedure:
Last safe event sequence/checkpoint:
Automatic rollback thresholds:
Rollback rehearsal result:

### Outcome

Result: planned | running | completed | completed_with_errors | rolled_back
Final evidence links:
Follow-up actions:
```

## 13. CI/CD acceptance matrix

| Gate | Dev | Test | Staging | Production |
|---|---:|---:|---:|---:|
| Schema validation | required | required | required | required |
| Historical golden fixtures | required | required | required | required |
| Full upcaster-chain replay | sampled | full fixtures | representative history | pre-cutover shadow |
| Projection hash comparison | optional | required | required | required |
| Blue/green overlap test | optional | required | required | required |
| Config/secret validation | required | required | required | required |
| Rollback rehearsal | optional | required | required | recorded prior proof |
| Backfill dry run/reconciliation | if applicable | required | required | required |
| User-data preservation | required | required | required | required |
| Installer Install/Update/Repair | if app payload changes | required | required | release gate |

## 14. Release decision

The release is safe to promote only when all of the following are true:

- every stored event version in scope has a tested path to the current reader;
- blue and green are overlap-compatible;
- new task attempts resolve to the intended published version;
- historical attempts resolve to their exact immutable version;
- config and secret changes are versioned, validated, and rollback-ready;
- full replay and snapshot-plus-tail replay agree;
- shadow projections reconcile or every intentional delta is explained;
- backfill outputs are source-linked, idempotent, and consent-compliant;
- no migration converts unknown or typed text into speaking evidence;
- rollback has been rehearsed without modifying the immutable store;
- local release workflows preserve learner audio, attempts, transcripts, and progress.

If any condition fails, traffic remains on blue and the change is not promoted.
