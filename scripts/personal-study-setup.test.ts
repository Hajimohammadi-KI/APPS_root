import { afterAll, beforeAll, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import type {
  CurriculumPack,
  PracticeTask,
} from "../shared/learning-core/src/automaticity/curriculum";
import { createContentReviewPacket } from "./lib/curriculum-review-packets";
import {
  prepareCurriculumReviewImport,
  applyCurriculumReviews,
} from "./lib/reviewed-curriculum";
import { sha256, type CoverageCell } from "./lib/automaticity-release-reviews";
import {
  personalStudyReadiness,
  freezePersonalStudy,
  personalStudyStatus,
  currentPersonalStudyStatus,
  deliverPersonalStudyForm,
  writeFrozenPersonalStudy,
  type PersonalStudyDraft,
  withdrawPersonalStudy,
  writePersonalStudyDelivery,
} from "./lib/personal-study-setup";

const now = "2026-11-04T12:00:00.000Z";
let root: string;
let practice: CurriculumPack[];
let catalog: {
  schemaVersion: number;
  packs: CurriculumPack[];
  reviews: unknown[];
};
let draft: PersonalStudyDraft;
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "personal-study-synthetic-"));
  const task: PracticeTask = {
    id: "practice",
    version: "1",
    constructionId: "en.c.001",
    familyId: "G01",
    itemFamily: "practice-family",
    contextId: "practice-context",
    rubricVersion: "rubric-1",
    stage: "transfer",
    modality: "writing",
    partition: "practice",
    transferCondition: "elicited",
    contentReview: "authored",
    prompt: "A previously seen practice prompt.",
    answerPolicy: "open",
    responseKind: "free_output",
    acceptedAnswers: [],
    hints: [],
    solution: null,
    normalisation: {
      nfc: true,
      whitespace: true,
      terminalFullStop: true,
      preserveCase: true,
    },
    sourceId: "practice-source",
  };
  const pack: CurriculumPack = {
    language: "en",
    version: "1",
    mappingVersion: "1",
    units: [
      {
        id: "en.c.001",
        language: "en",
        title: "Engineering fixture only",
        level: "A1",
        familyIds: ["G01"],
        prerequisites: [],
        lessonAlias: "fixture",
        rule: "Fixture",
        examples: [],
        commonError: "Fixture",
        review: "authored",
        sources: [],
        tasks: [task],
      },
    ],
  };
  practice = [pack];
  const privatePack = structuredClone(pack);
  privatePack.units[0]!.tasks = ["pre", "post", "day7", "day30"].map(
    (phase) => ({
      ...structuredClone(task),
      id: `probe-${phase}`,
      partition: "evaluation",
      itemFamily: `private-family-${phase}`,
      contextId: `private-context-${phase}`,
      sourceId: `private-source-${phase}`,
      prompt: `Synthetic unseen situation ${phase}; never ship this fixture.`,
    }),
  );
  const unit = privatePack.units[0]!;
  const cells: CoverageCell[] = [
    {
      language: "en",
      constructionId: unit.id,
      contentVersion: "1",
      mappingVersion: "1",
      stage: "transfer",
      modality: "writing",
      taskIds: unit.tasks.map((row) => row.id),
      humanReview: "pending",
      evaluator: "human-review-required",
      releaseEligible: false,
    },
  ];
  const packet = createContentReviewPacket(privatePack, unit).reviewDrafts[0]!;
  const review = (raw: typeof packet.contentEvidenceDraft) => ({
    ...structuredClone(raw),
    provenance: "human_review",
    reviewerId: "Reviewer A",
    role: "Language teacher",
    reviewedAt: "2026-11-03T12:00:00Z",
    decision: "approved",
    note: "Synthetic transport fixture in an isolated temporary test root only.",
    checks: raw.checks
      ? Object.fromEntries(Object.keys(raw.checks).map((key) => [key, true]))
      : null,
    taskReviews: raw.taskReviews.map((row) => ({
      ...row,
      note: "Synthetic judgment, not a real human review.",
      checks: Object.fromEntries(
        Object.keys(row.checks).map((key) => [key, true]),
      ),
    })),
  });
  const evaluator = review(packet.manualEvaluatorEvidenceDraft);
  evaluator.evaluator = {
    ...packet.manualEvaluatorEvidenceDraft.evaluator!,
    id: "teacher-procedure",
    version: "1",
  };
  const prepared = prepareCurriculumReviewImport(
    {
      schemaVersion: 1,
      contentReviews: [review(packet.contentEvidenceDraft)],
      evaluatorReviews: [evaluator],
    },
    new Map([["en", privatePack]]),
    cells,
    [],
    "artifacts/curriculum-review-import/synthetic",
    now,
  );
  for (const file of prepared.files) {
    await mkdir(dirname(resolve(root, file.path)), { recursive: true });
    await writeFile(resolve(root, file.path), file.contents);
  }
  const applied = await applyCurriculumReviews(
    root,
    new Map([["en", privatePack]]),
    cells,
    prepared.reviews,
    now,
  );
  const reviewedPack = applied.packs.get("en")!;
  catalog = {
    schemaVersion: 1,
    packs: [reviewedPack],
    reviews: prepared.reviews,
  };
  const windows = [
    ["pre", "2026-11-05T10:00:00Z", "2026-11-05T11:00:00Z"],
    ["post", "2026-11-06T12:00:00Z", "2026-11-06T13:00:00Z"],
    ["day7", "2026-11-13T12:00:00Z", "2026-11-13T13:00:00Z"],
    ["day30", "2026-12-06T12:00:00Z", "2026-12-06T13:00:00Z"],
  ] as const;
  draft = {
    schemaVersion: 2,
    id: "11111111-1111-4111-8111-111111111111",
    version: 1,
    language: "en",
    participantKey: "22222222-2222-4222-8222-222222222222",
    consent: { at: now, purpose: "personal_transfer_retention" },
    training: {
      startsAt: "2026-11-05T12:00:00Z",
      endsAt: "2026-11-06T12:00:00Z",
    },
    timingPolicy: "follow_up_since_training",
    preStudyAbility: "current_ability_with_prior_practice",
    teacher: {
      reviewerId: "Reviewer A",
      role: "Language teacher",
      timingAttestationRequired: true,
    },
    forms: windows.map(([phase, opensAt, closesAt]) => ({
      phase,
      opensAt,
      closesAt,
      tasks: [
        {
          taskId: `probe-${phase}`,
          definitionSha256: sha256(
            JSON.stringify(
              reviewedPack.units[0]!.tasks.find(
                (row) => row.id === `probe-${phase}`,
              )!,
            ),
          ),
        },
      ],
    })),
  };
});
afterAll(async () => {
  if (
    !resolve(root).startsWith(resolve(tmpdir()) + "/") &&
    !resolve(root).startsWith(resolve(tmpdir()) + "\\")
  )
    throw Error("Unsafe test cleanup");
  await rm(root, { recursive: true, force: true });
});
const freeze = (value: unknown = draft, bank: unknown = catalog, at = now) =>
  freezePersonalStudy(root, value, bank, practice, at);
const consent = (checkedAt: string) => ({
  active: true as const,
  checkedAt,
  participantKey: draft.participantKey,
});

test("empty readiness is explicitly preparation with no observations or hidden forms", () => {
  const value = personalStudyReadiness();
  expect(value).toMatchObject({
    status: "awaiting_human_evidence",
    actualObservations: 0,
    activePlan: false,
    automaticMasteryGranted: false,
    causalBenefitEstablished: false,
  });
  expect(value.phases.map((form) => form.phase)).toEqual([
    "pre",
    "post",
    "day7",
    "day30",
  ]);
  expect(JSON.stringify(value)).not.toMatch(
    /Synthetic unseen|acceptedAnswers|prompt/,
  );
});
test("freeze validates actual evidence and exports only safe identities and windows", async () => {
  const frozen = await freeze();
  expect(frozen.planSha256).toMatch(/^[a-f0-9]{64}$/);
  const status = personalStudyStatus(frozen);
  expect(status.actualObservations).toBe(0);
  expect(JSON.stringify(status)).not.toMatch(
    /Synthetic unseen|acceptedAnswers|sourceId|prompt/,
  );
  expect(frozen.study.frozenAt).toBe(now);
});
test("missing or fabricated review flags cannot create an active plan", async () => {
  for (const bank of [null, { ...catalog, reviews: [] }])
    await expect(freeze(draft, bank)).rejects.toThrow();
});
test("form blueprint and exact teacher procedure must cover all selected targets", async () => {
  const counts = structuredClone(draft);
  counts.forms[1]!.tasks.push(structuredClone(counts.forms[1]!.tasks[0]!));
  await expect(freeze(counts)).rejects.toThrow(/blueprint/);
  const teacher = structuredClone(draft);
  teacher.teacher.role = "Different unregistered procedure";
  await expect(freeze(teacher)).rejects.toThrow(/teacher procedure/);
});
test.each(["task", "family", "context", "prompt", "source", "hash", "rubric"])(
  "rejects reused or changed %s identities",
  async (kind) => {
    const bank = structuredClone(catalog),
      value = structuredClone(draft);
    const first = bank.packs[0]!.units[0]!.tasks[0]!,
      second = bank.packs[0]!.units[0]!.tasks[1]!;
    if (kind === "task")
      value.forms[1]!.tasks = structuredClone(value.forms[0]!.tasks);
    if (kind === "family") second.itemFamily = first.itemFamily;
    if (kind === "context") second.contextId = first.contextId;
    if (kind === "prompt") second.prompt = first.prompt;
    if (kind === "source") second.sourceId = first.sourceId;
    if (kind === "hash")
      value.forms[0]!.tasks[0]!.definitionSha256 = "a".repeat(64);
    if (kind === "rubric") second.rubricVersion = "changed";
    await expect(freeze(value, bank)).rejects.toThrow();
  },
);
test.each([
  "retroactive",
  "consent",
  "withdrawn",
  "overlap",
  "early7",
  "early30",
  "email",
  "missing",
  "speech",
])("rejects unsafe %s setup", async (kind) => {
  const value = structuredClone(draft);
  if (kind === "retroactive") value.forms[0]!.opensAt = "2026-11-03T10:00:00Z";
  if (kind === "consent") value.consent.at = "2026-11-05T10:00:00Z";
  if (kind === "withdrawn") Object.assign(value.consent, { withdrawnAt: now });
  if (kind === "overlap") value.forms[1]!.opensAt = value.forms[0]!.opensAt;
  if (kind === "early7") value.forms[2]!.opensAt = "2026-11-12T12:00:00Z";
  if (kind === "early30") value.forms[3]!.opensAt = "2026-12-05T12:00:00Z";
  if (kind === "email") value.participantKey = "me@example.com";
  if (kind === "missing") value.forms.pop();
  if (kind === "speech") Object.assign(value, { modality: "speaking" });
  await expect(freeze(value)).rejects.toThrow();
});
test("due form never exposes future prompts and refuses early, late, withdrawal, changed snapshot or clock rollback", async () => {
  const frozen = await freeze();
  const delivered = await deliverPersonalStudyForm(
    root,
    frozen,
    catalog,
    practice,
    "pre",
    "2026-11-05T10:30:00Z",
    { currentConsent: consent("2026-11-05T10:30:00Z") },
  );
  expect(delivered.tasks).toHaveLength(1);
  expect(delivered.tasks[0]!.prompt).toContain("pre");
  expect(delivered.timing[0]!.interveningPracticeOrTests).toBeNull();
  expect(JSON.stringify(delivered)).not.toContain("situation day7");
  for (const at of [
    "2026-11-03T10:00:00Z",
    "2026-11-05T09:59:59Z",
    "2026-11-05T11:00:01Z",
  ])
    await expect(
      deliverPersonalStudyForm(root, frozen, catalog, practice, "pre", at, {
        currentConsent: consent(at),
      }),
    ).rejects.toThrow();
  await expect(
    deliverPersonalStudyForm(
      root,
      frozen,
      catalog,
      practice,
      "pre",
      "2026-11-05T10:30:00Z",
      {
        currentConsent: consent("2026-11-05T10:30:00Z"),
        withdrawnAt: "2026-11-05T10:00:00Z",
      },
    ),
  ).rejects.toThrow();
  const changed = structuredClone(practice);
  changed[0]!.version = "changed";
  await expect(
    deliverPersonalStudyForm(
      root,
      frozen,
      catalog,
      changed,
      "pre",
      "2026-11-05T10:30:00Z",
      { currentConsent: consent("2026-11-05T10:30:00Z") },
    ),
  ).rejects.toThrow();
});
test("day30 is explicitly follow-up since training, with day7 testing visible", async () => {
  const frozen = await freeze();
  const delivered = await deliverPersonalStudyForm(
    root,
    frozen,
    catalog,
    practice,
    "day30",
    "2026-12-06T12:30:00Z",
    {
      currentConsent: consent("2026-12-06T12:30:00Z"),
      targetActivities: [
        {
          at: "2026-11-13T12:30:00Z",
          constructionId: "en.c.001",
          kind: "test",
        },
        {
          at: "2026-11-02T10:00:00Z",
          constructionId: "en.c.001",
          kind: "practice",
        },
      ],
    },
  );
  expect(delivered.timingPolicy).toBe("follow_up_since_training");
  expect(delivered.timing[0]!.hoursSinceTraining).toBe(720.5);
  expect(delivered.timing[0]!.hoursSinceLastTargetActivity).toBe(552);
  expect(delivered.untouchedRetentionClaim).toBe(false);
  expect(delivered.evaluationPerformed).toBe(false);
  expect(delivered.timing[0]!.interveningActivities).toHaveLength(1);
  expect(delivered.timing[0]!.interveningPracticeOrTests).toBe(1);
});

test("live consent is required and a persisted withdrawal cannot be overridden by frozen or current consent", async () => {
  const frozen = await freeze({
    ...draft,
    id: "33333333-3333-4333-8333-333333333333",
  });
  await expect(
    deliverPersonalStudyForm(
      root,
      frozen,
      catalog,
      practice,
      "pre",
      "2026-11-05T10:30:00Z",
    ),
  ).rejects.toThrow();
  await withdrawPersonalStudy(root, frozen, "2026-11-05T09:00:00Z");
  await expect(
    deliverPersonalStudyForm(
      root,
      frozen,
      catalog,
      practice,
      "pre",
      "2026-11-05T10:30:00Z",
      { currentConsent: consent("2026-11-05T10:30:00Z") },
    ),
  ).rejects.toThrow(/withdrawn/);
});

test("timeline input cannot export extra identity or future question data", async () => {
  const frozen = await freeze();
  await expect(
    deliverPersonalStudyForm(
      root,
      frozen,
      catalog,
      practice,
      "pre",
      "2026-11-05T10:30:00Z",
      {
        currentConsent: consent("2026-11-05T10:30:00Z"),
        targetActivities: [
          {
            at: "2026-11-05T09:00:00Z",
            constructionId: "en.c.001",
            kind: "practice",
            learnerName: "Private identity",
            prompt: "Hidden future question",
          } as never,
        ],
      },
    ),
  ).rejects.toThrow();
});

test("current status observes durable withdrawal without rewriting the frozen plan or exposing identity", async () => {
  const frozen = await freeze({
    ...draft,
    id: "44444444-4444-4444-8444-444444444444",
  });
  const before = JSON.stringify(frozen);
  expect(await currentPersonalStudyStatus(root, frozen)).toMatchObject({
    status: "frozen_preparation",
    activePlan: false,
  });
  const receipt = await withdrawPersonalStudy(
    root,
    frozen,
    "2026-11-05T09:00:00Z",
  );
  const status = await currentPersonalStudyStatus(root, frozen);
  expect(status).toMatchObject({
    status: "consent_withdrawn",
    activePlan: false,
    withdrawnAt: "2026-11-05T09:00:00Z",
  });
  expect(JSON.stringify(status)).not.toContain(frozen.study.participantKey);
  expect(JSON.stringify(frozen)).toBe(before);
  expect(personalStudyStatus(frozen).status).toBe("frozen_preparation");
  await writeFile(receipt, "{ malformed");
  await expect(currentPersonalStudyStatus(root, frozen)).rejects.toThrow();
});
test("frozen files are write-once in the private artifacts area", async () => {
  const frozen = await freeze();
  const path = await writeFrozenPersonalStudy(root, frozen);
  expect(JSON.parse(await readFile(path, "utf8"))).toEqual(frozen);
  await expect(writeFrozenPersonalStudy(root, frozen)).rejects.toThrow();
});
test("teacher form delivery is private and atomically write-once under concurrent writes", async () => {
  const frozen = await freeze();
  const form = await deliverPersonalStudyForm(
    root,
    frozen,
    catalog,
    practice,
    "pre",
    "2026-11-05T10:30:00Z",
    { currentConsent: consent("2026-11-05T10:30:00Z") },
  );
  const writes = await Promise.allSettled([
    writePersonalStudyDelivery(root, frozen, form),
    writePersonalStudyDelivery(root, frozen, form),
  ]);
  expect(writes.filter((write) => write.status === "fulfilled")).toHaveLength(
    1,
  );
  expect(writes.filter((write) => write.status === "rejected")).toHaveLength(1);
});
test("owner CLI empty mode emits only no-study readiness", () => {
  const result = Bun.spawnSync(
    [process.execPath, "scripts/prepare-personal-study.ts", "--empty"],
    { cwd: resolve(import.meta.dir, "..") },
  );
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout.toString())).toMatchObject({
    activePlan: false,
    actualObservations: 0,
    status: "awaiting_human_evidence",
  });
  const invalid = Bun.spawnSync(
    [process.execPath, "scripts/prepare-personal-study.ts", "--deliver"],
    { cwd: resolve(import.meta.dir, "..") },
  );
  expect(invalid.exitCode).not.toBe(0);
  expect(invalid.stdout.toString()).toBe("");
});

test("safe status, delivery and writer reject tampered or extra-field envelopes", async () => {
  const frozen = await freeze();
  for (const changed of [
    null,
    { ...frozen, planSha256: "a".repeat(64) },
    { ...frozen, study: { ...frozen.study, id: "../public/leak" } },
  ]) {
    expect(() => personalStudyStatus(changed as never)).toThrow();
    await expect(
      writeFrozenPersonalStudy(root, changed as never),
    ).rejects.toThrow();
  }
  const injected = structuredClone(frozen);
  Object.assign(injected.study.forms[0]!.tasks[0]!, {
    prompt: "Never expose future text",
  });
  injected.planSha256 = sha256(JSON.stringify(injected.study));
  expect(() => personalStudyStatus(injected)).toThrow();
});
