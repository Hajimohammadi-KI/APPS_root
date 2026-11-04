import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  isRecord,
  validDate,
  type Language,
} from "../../shared/learning-core/src/automaticity/contracts";
import type {
  CurriculumPack,
  PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";
import type { StudyProbe } from "./learning-study";
import { sha256 } from "./automaticity-release-reviews";
import { loadStudyProbeCatalog } from "./study-probe-catalog";

export const PERSONAL_STUDY_PHASES = ["pre", "post", "day7", "day30"] as const;
export type PersonalStudyPhase = (typeof PERSONAL_STUDY_PHASES)[number];
type TaskReference = Pick<StudyProbe, "taskId" | "definitionSha256">;
export interface PersonalStudyDraft {
  schemaVersion: 2;
  id: string;
  version: number;
  previousPlanSha256?: string;
  language: Language;
  participantKey: string;
  consent: {
    at: string;
    purpose: "personal_transfer_retention";
    withdrawnAt?: string;
  };
  training: { startsAt: string; endsAt: string };
  timingPolicy: "follow_up_since_training";
  preStudyAbility: "current_ability_with_prior_practice";
  teacher: {
    reviewerId: string;
    role: string;
    timingAttestationRequired: true;
  };
  forms: {
    phase: PersonalStudyPhase;
    opensAt: string;
    closesAt: string;
    tasks: TaskReference[];
  }[];
}
export interface FrozenPersonalStudy {
  schemaVersion: 1;
  study: PersonalStudyDraft & {
    frozenAt: string;
    modality: "writing";
    practiceSnapshotSha256: string;
    privateCatalogSha256: string;
  };
  planSha256: string;
}
const DAY = 86_400_000;
const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
const hash = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && !!value.trim() && value.length <= 500;
const at = (value: string) => Date.parse(value);
const fingerprint = (value: string) =>
  value.normalize("NFC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en");

/** Public preparation status contains no registered participant, private bank or future question. */
export function personalStudyReadiness() {
  return {
    schemaVersion: 1,
    status: "awaiting_human_evidence" as const,
    activePlan: false as const,
    actualObservations: 0,
    evaluationPerformed: false as const,
    automaticMasteryGranted: false as const,
    causalBenefitEstablished: false as const,
    phases: PERSONAL_STUDY_PHASES.map((phase) => ({
      phase,
      status: "awaiting_reviewed_private_form",
      opensAt: null,
      closesAt: null,
    })),
    timingPolicy: "follow_up_since_training" as const,
    untouchedRetentionClaim: false as const,
    clockVerifiedByServer: false as const,
    teacherTimingAttestationRequired: true as const,
  };
}

function parseDraft(value: unknown, now: string): PersonalStudyDraft {
  if (
    !validDate(now) ||
    !isRecord(value) ||
    value.schemaVersion !== 2 ||
    !uuid(value.id) ||
    !Number.isSafeInteger(value.version) ||
    Number(value.version) < 1 ||
    !["en", "de"].includes(String(value.language)) ||
    !uuid(value.participantKey) ||
    value.timingPolicy !== "follow_up_since_training" ||
    value.preStudyAbility !== "current_ability_with_prior_practice" ||
    (value.modality !== undefined && value.modality !== "writing") ||
    !isRecord(value.consent) ||
    value.consent.purpose !== "personal_transfer_retention" ||
    !validDate(value.consent.at) ||
    value.consent.withdrawnAt !== undefined ||
    at(value.consent.at) > at(now) ||
    !isRecord(value.training) ||
    !validDate(value.training.startsAt) ||
    !validDate(value.training.endsAt) ||
    at(value.training.startsAt) >= at(value.training.endsAt) ||
    !isRecord(value.teacher) ||
    !text(value.teacher.reviewerId) ||
    !text(value.teacher.role) ||
    value.teacher.timingAttestationRequired !== true ||
    !Array.isArray(value.forms) ||
    value.forms.length !== 4
  )
    throw Error(
      "A prospective four-form writing plan, pseudonym, explicit consent and teacher procedure are required",
    );
  const allowed = new Set([
    "schemaVersion",
    "id",
    "version",
    "previousPlanSha256",
    "language",
    "participantKey",
    "consent",
    "training",
    "timingPolicy",
    "preStudyAbility",
    "teacher",
    "forms",
    "modality",
  ]);
  if (
    Object.keys(value).some((key) => !allowed.has(key)) ||
    Object.keys(value.consent).some(
      (key) => !["at", "purpose"].includes(key),
    ) ||
    Object.keys(value.training).some(
      (key) => !["startsAt", "endsAt"].includes(key),
    ) ||
    Object.keys(value.teacher).some(
      (key) =>
        !["reviewerId", "role", "timingAttestationRequired"].includes(key),
    )
  )
    throw Error("Study setup must not include extra identity or learner data");
  if (
    value.version === 1
      ? value.previousPlanSha256 !== undefined
      : !hash(value.previousPlanSha256)
  )
    throw Error("A revised plan requires the previous frozen plan hash");
  let previousEnd = at(now);
  for (const [index, form] of value.forms.entries()) {
    if (
      !isRecord(form) ||
      form.phase !== PERSONAL_STUDY_PHASES[index] ||
      !validDate(form.opensAt) ||
      !validDate(form.closesAt) ||
      at(form.opensAt) < previousEnd ||
      at(form.opensAt) >= at(form.closesAt) ||
      Object.keys(form).some(
        (key) => !["phase", "opensAt", "closesAt", "tasks"].includes(key),
      ) ||
      !Array.isArray(form.tasks) ||
      !form.tasks.length ||
      form.tasks.length > 100 ||
      form.tasks.some(
        (ref) =>
          !isRecord(ref) ||
          !text(ref.taskId) ||
          !hash(ref.definitionSha256) ||
          Object.keys(ref).some(
            (key) => !["taskId", "definitionSha256"].includes(key),
          ),
      )
    )
      throw Error(
        "Separate prospective forms with exact task hashes and non-overlapping windows are required",
      );
    previousEnd = at(form.closesAt);
    if (
      index === 0
        ? at(form.closesAt) > at(value.training.startsAt)
        : at(form.opensAt) <
          at(value.training.endsAt) +
            (index === 2 ? 7 : index === 3 ? 30 : 0) * DAY
    )
      throw Error("A form crosses its planned pre/post/7-day/30-day boundary");
  }
  return structuredClone(value) as unknown as PersonalStudyDraft;
}

async function validateBank(
  root: string,
  study: PersonalStudyDraft,
  catalog: unknown,
  practice: readonly CurriculumPack[],
  now: string,
) {
  const loaded = await loadStudyProbeCatalog(root, catalog, practice, now);
  if (!isRecord(catalog) || !Array.isArray(catalog.packs))
    throw Error("Missing private catalog");
  const privatePacks = catalog.packs as CurriculumPack[];
  const tasks = privatePacks
    .filter((pack) => pack.language === study.language)
    .flatMap((pack) => pack.units.flatMap((unit) => unit.tasks));
  const selected: PracticeTask[] = [];
  const keys = new Map<string, Set<string>>(
    ["id", "itemFamily", "contextId", "prompt", "sourceId"].map((key) => [
      key,
      new Set(),
    ]),
  );
  for (const task of practice
    .filter((pack) => pack.language === study.language)
    .flatMap((pack) => pack.units.flatMap((unit) => unit.tasks)))
    for (const [key, known] of keys)
      known.add(
        fingerprint(
          task[
            key as "id" | "itemFamily" | "contextId" | "prompt" | "sourceId"
          ],
        ),
      );
  const rubrics = new Map<string, string>();
  let expectedBlueprint: string | undefined;
  for (const form of study.forms) {
    const counts = new Map<string, number>();
    for (const reference of form.tasks) {
      const task = tasks.find((row) => row.id === reference.taskId);
      if (!task) throw Error("Missing selected private task");
      const key = `${task.constructionId}:${task.rubricVersion}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const blueprint = JSON.stringify(
      [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)),
    );
    if (expectedBlueprint !== undefined && blueprint !== expectedBlueprint)
      throw Error(
        "Each form must use the same target and rubric-count blueprint",
      );
    expectedBlueprint = blueprint;
  }
  for (const form of study.forms)
    for (const reference of form.tasks) {
      const task = tasks.find((task) => task.id === reference.taskId);
      if (
        !task ||
        task.modality !== "writing" ||
        task.partition !== "evaluation" ||
        task.contentReview !== "human_reviewed" ||
        task.answerPolicy !== "open" ||
        task.acceptedAnswers.length ||
        task.hints.length ||
        task.solution !== null ||
        task.definitionSha256 !== undefined ||
        reference.definitionSha256 !== sha256(JSON.stringify(task))
      )
        throw Error(
          "A form requires its exact privately reviewed writing definition",
        );
      for (const [key, known] of keys) {
        const value = fingerprint(
          task[
            key as "id" | "itemFamily" | "contextId" | "prompt" | "sourceId"
          ],
        );
        if (!value || known.has(value))
          throw Error(
            `Held-out form reuses ${key} from practice or another form`,
          );
        known.add(value);
      }
      const rubric = rubrics.get(task.constructionId);
      if (rubric !== undefined && rubric !== task.rubricVersion)
        throw Error("Study target rubric changed across forms");
      rubrics.set(task.constructionId, task.rubricVersion);
      if (
        !loaded.reviews.some(
          (review) =>
            review.language === study.language &&
            review.constructionId === task.constructionId &&
            review.stage === task.stage &&
            review.modality === task.modality &&
            review.evaluators.some(
              (evaluator) =>
                evaluator.kind === "human" &&
                evaluator.taskIds.includes(task.id) &&
                evaluator.rubricVersions.includes(task.rubricVersion) &&
                evaluator.review.reviewerId === study.teacher.reviewerId &&
                evaluator.review.role === study.teacher.role,
            ),
        )
      )
        throw Error(
          "The named teacher procedure must cover every selected task and rubric",
        );
      selected.push(task);
    }
  return selected;
}

function checkedFrozen(value: unknown): FrozenPersonalStudy {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    Object.keys(value).some(
      (key) => !["schemaVersion", "study", "planSha256"].includes(key),
    ) ||
    !isRecord(value.study) ||
    !validDate(value.study.frozenAt) ||
    value.study.modality !== "writing" ||
    !hash(value.study.practiceSnapshotSha256) ||
    !hash(value.study.privateCatalogSha256) ||
    !hash(value.planSha256) ||
    value.planSha256 !== sha256(JSON.stringify(value.study))
  )
    throw Error("Invalid frozen study envelope or checksum");
  const {
    frozenAt,
    modality: _modality,
    practiceSnapshotSha256: _practice,
    privateCatalogSha256: _catalog,
    ...draft
  } = value.study;
  parseDraft(draft, frozenAt);
  return value as unknown as FrozenPersonalStudy;
}

/** The existing catalog loader verifies real artifact hashes and review procedures before freezing. */
export async function freezePersonalStudy(
  root: string,
  draft: unknown,
  catalog: unknown,
  practice: readonly CurriculumPack[],
  now: string,
): Promise<FrozenPersonalStudy> {
  const value = parseDraft(draft, now);
  await rejectWithdrawal(root, value.id, value.participantKey);
  await validateBank(root, value, catalog, practice, now);
  if (value.version > 1) {
    const previous = checkedFrozen(
      JSON.parse(
        await readFile(
          resolve(
            root,
            "artifacts/learning-study/personal-plans",
            `${value.id}.v${value.version - 1}.json`,
          ),
          "utf8",
        ),
      ),
    );
    if (
      previous.study.id !== value.id ||
      previous.study.version !== value.version - 1 ||
      previous.study.language !== value.language ||
      previous.study.participantKey !== value.participantKey ||
      previous.planSha256 !== value.previousPlanSha256
    )
      throw Error("Previous frozen revision does not match");
  }
  const study: FrozenPersonalStudy["study"] = {
    ...value,
    frozenAt: now,
    modality: "writing",
    practiceSnapshotSha256: sha256(JSON.stringify(practice)),
    privateCatalogSha256: sha256(JSON.stringify(catalog)),
  };
  return { schemaVersion: 1, study, planSha256: sha256(JSON.stringify(study)) };
}

/** The shared public/export summary deliberately omits questions, answers, teacher names and consent identity. */
export function personalStudyStatus(value: unknown) {
  const frozen = checkedFrozen(value);
  return {
    schemaVersion: 1,
    studyId: frozen.study.id,
    version: frozen.study.version,
    language: frozen.study.language,
    planSha256: frozen.planSha256,
    frozenAt: frozen.study.frozenAt,
    practiceSnapshotSha256: frozen.study.practiceSnapshotSha256,
    privateCatalogSha256: frozen.study.privateCatalogSha256,
    status: "frozen_preparation",
    activePlan: false,
    frozenPlanPresent: true,
    currentConsent: "must_be_checked_live",
    actualObservations: 0,
    evaluationPerformed: false,
    phases: frozen.study.forms.map(({ phase, opensAt, closesAt, tasks }) => ({
      phase,
      opensAt,
      closesAt,
      tasks: tasks.map(({ taskId, definitionSha256 }) => ({
        taskId,
        definitionSha256,
      })),
    })),
    timingPolicy: frozen.study.timingPolicy,
    untouchedRetentionClaim: false,
    teacherTimingAttestationRequired: true,
    clockVerifiedByServer: false,
    automaticMasteryGranted: false,
    causalBenefitEstablished: false,
  };
}

interface DeliveryContext {
  currentConsent?: { active: true; checkedAt: string; participantKey: string };
  withdrawnAt?: string;
  lastObservedAt?: string;
  targetActivities?: readonly {
    at: string;
    constructionId: string;
    kind: "practice" | "test" | "exposure";
  }[];
}
/** Teacher-only delivery: the status export stays separate and never includes future forms. This does not score responses. */
export async function deliverPersonalStudyForm(
  root: string,
  value: unknown,
  catalog: unknown,
  practice: readonly CurriculumPack[],
  phase: PersonalStudyPhase,
  now: string,
  context: DeliveryContext = {},
) {
  const frozen = checkedFrozen(value);
  if (
    !isRecord(context) ||
    Object.keys(context).some(
      (key) =>
        ![
          "currentConsent",
          "withdrawnAt",
          "lastObservedAt",
          "targetActivities",
        ].includes(key),
    ) ||
    (context.targetActivities !== undefined &&
      !Array.isArray(context.targetActivities))
  )
    throw Error("Invalid delivery consent and timeline context");
  if (
    !isRecord(frozen) ||
    frozen.schemaVersion !== 1 ||
    !isRecord(frozen.study) ||
    !validDate(now) ||
    !validDate(frozen.study.frozenAt) ||
    at(now) < at(frozen.study.frozenAt) ||
    frozen.planSha256 !== sha256(JSON.stringify(frozen.study)) ||
    frozen.study.practiceSnapshotSha256 !== sha256(JSON.stringify(practice)) ||
    frozen.study.privateCatalogSha256 !== sha256(JSON.stringify(catalog)) ||
    context.withdrawnAt !== undefined ||
    (context.lastObservedAt !== undefined &&
      (!validDate(context.lastObservedAt) ||
        at(now) < at(context.lastObservedAt)))
  )
    throw Error("Frozen plan, snapshot, consent or clock does not match");
  const current = context.currentConsent;
  if (
    !isRecord(current) ||
    current.active !== true ||
    current.participantKey !== frozen.study.participantKey ||
    !validDate(current.checkedAt) ||
    at(current.checkedAt) > at(now) ||
    at(now) - at(current.checkedAt) > 300_000 ||
    Object.keys(current).some(
      (key) => !["active", "checkedAt", "participantKey"].includes(key),
    )
  )
    throw Error(
      "Fresh explicit current consent is required before delivering a form",
    );
  await rejectWithdrawal(root, frozen.study.id, frozen.study.participantKey);
  const {
    frozenAt,
    modality: _modality,
    practiceSnapshotSha256: _practice,
    privateCatalogSha256: _catalog,
    ...draft
  } = frozen.study;
  const study = parseDraft(draft, frozenAt);
  const tasks = await validateBank(root, study, catalog, practice, now);
  const form = study.forms.find((form) => form.phase === phase);
  if (!form || at(now) < at(form.opensAt) || at(now) > at(form.closesAt))
    throw Error("Only a due form inside its frozen window may be delivered");
  const activities = context.targetActivities ?? [];
  if (
    activities.some(
      (entry) =>
        !isRecord(entry) ||
        !validDate(entry.at) ||
        !text(entry.constructionId) ||
        typeof entry.kind !== "string" ||
        !["practice", "test", "exposure"].includes(entry.kind) ||
        at(entry.at) > at(now) ||
        Object.keys(entry).some(
          (key) => !["at", "constructionId", "kind"].includes(key),
        ),
    )
  )
    throw Error("Invalid target activity timeline");
  const due = form.tasks.map((reference) =>
    tasks.find((task) => task.id === reference.taskId)!,
  );
  return {
    schemaVersion: 1,
    studyId: study.id,
    planSha256: frozen.planSha256,
    phase,
    deliveredAt: now,
    language: study.language,
    modality: "writing",
    timingPolicy: study.timingPolicy,
    trainingTimeSource: "frozen_plan_not_attested",
    tasks: due.map((task) => ({
      taskId: task.id,
      definitionSha256: sha256(JSON.stringify(task)),
      constructionId: task.constructionId,
      rubricVersion: task.rubricVersion,
      prompt: task.prompt,
    })),
    timing: [...new Set(due.map((task) => task.constructionId))].map(
      (constructionId) => {
        const relevant = activities.filter(
          (entry) => entry.constructionId === constructionId,
        );
        const last = relevant.reduce(
          (latest, entry) => Math.max(latest, at(entry.at)),
          Number.NEGATIVE_INFINITY,
        );
        const intervening =
          phase === "pre"
            ? []
            : relevant.filter(
                (entry) => at(entry.at) >= at(study.training.endsAt),
              );
        return {
          constructionId,
          elapsedSinceTrainingMs:
            phase === "pre" ? null : at(now) - at(study.training.endsAt),
          hoursSinceTraining:
            phase === "pre"
              ? null
              : (at(now) - at(study.training.endsAt)) / 3_600_000,
          hoursSinceLastTargetActivity: Number.isFinite(last)
            ? (at(now) - last) / 3_600_000
            : null,
          latestTargetActivityAt: Number.isFinite(last)
            ? new Date(last).toISOString()
            : null,
          interveningPracticeOrTests:
            context.targetActivities === undefined
              ? null
              : intervening.filter((entry) => entry.kind !== "exposure").length,
          interveningActivities: intervening.map(
            ({ at, constructionId, kind }) => ({ at, constructionId, kind }),
          ),
        };
      },
    ),
    teacherTimingAttestation: { required: true, confirmed: false },
    timelineCompleteness: "teacher_must_verify",
    clockVerifiedByServer: false,
    untouchedRetentionClaim: false,
    evaluationPerformed: false,
    automaticMasteryGranted: false,
    causalBenefitEstablished: false,
  };
}

/** Write only to the ignored private artifact area. Every version is immutable. */
async function privateFolder(root: string): Promise<string> {
  let folder = await realpath(root);
  for (const segment of ["artifacts", "learning-study", "personal-plans"]) {
    folder = resolve(folder, segment);
    try {
      const info = await lstat(folder);
      if (info.isSymbolicLink() || !info.isDirectory())
        throw Error("Private artifact path must be a real directory");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await mkdir(folder);
    }
  }
  return folder;
}

async function readWithdrawal(
  root: string,
  id: string,
  participantKey: string,
) {
  try {
    const raw: unknown = JSON.parse(
      await readFile(
        resolve(
          root,
          "artifacts/learning-study/personal-plans",
          `${id}.withdrawal.json`,
        ),
        "utf8",
      ),
    );
    if (
      !isRecord(raw) ||
      raw.studyId !== id ||
      raw.participantKey !== participantKey ||
      !validDate(raw.at) ||
      !hash(raw.planSha256)
    )
      throw Error("Invalid study withdrawal receipt");
    return { at: raw.at };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return null;
  }
}

async function rejectWithdrawal(
  root: string,
  id: string,
  participantKey: string,
) {
  if (await readWithdrawal(root, id, participantKey))
    throw Error("Study consent has been withdrawn; delivery is disabled");
}

/** Owner status reads current withdrawal state; the pure frozen summary has no filesystem access. */
export async function currentPersonalStudyStatus(root: string, value: unknown) {
  const frozen = checkedFrozen(value);
  const summary = personalStudyStatus(frozen);
  const withdrawal = await readWithdrawal(
    root,
    frozen.study.id,
    frozen.study.participantKey,
  );
  return {
    ...summary,
    status: withdrawal ? "consent_withdrawn" : summary.status,
    activePlan: false,
    currentConsent: withdrawal ? "withdrawn" : summary.currentConsent,
    withdrawnAt: withdrawal?.at ?? null,
  };
}

/** A durable withdrawal applies to every revision of the same study identity. */
export async function withdrawPersonalStudy(
  root: string,
  value: unknown,
  now: string,
): Promise<string> {
  const frozen = checkedFrozen(value);
  if (!validDate(now) || at(now) < at(frozen.study.frozenAt))
    throw Error("Invalid withdrawal time");
  const path = resolve(
    await privateFolder(root),
    `${frozen.study.id}.withdrawal.json`,
  );
  await writeFile(
    path,
    JSON.stringify(
      {
        schemaVersion: 1,
        studyId: frozen.study.id,
        participantKey: frozen.study.participantKey,
        planSha256: frozen.planSha256,
        at: now,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  return path;
}

export async function writeFrozenPersonalStudy(
  root: string,
  value: unknown,
): Promise<string> {
  const frozen = checkedFrozen(value);
  await rejectWithdrawal(root, frozen.study.id, frozen.study.participantKey);
  const path = resolve(
    await privateFolder(root),
    `${frozen.study.id}.v${frozen.study.version}.json`,
  );
  await writeFile(path, JSON.stringify(frozen, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  return path;
}

/** A due teacher form is private and write-once; it is not a public readiness export. */
export async function writePersonalStudyDelivery(
  root: string,
  value: unknown,
  delivery: Awaited<ReturnType<typeof deliverPersonalStudyForm>>,
): Promise<string> {
  const frozen = checkedFrozen(value);
  const form = frozen.study.forms.find((form) => form.phase === delivery.phase);
  if (
    !form ||
    delivery.studyId !== frozen.study.id ||
    delivery.planSha256 !== frozen.planSha256 ||
    !validDate(delivery.deliveredAt) ||
    at(delivery.deliveredAt) < at(form.opensAt) ||
    at(delivery.deliveredAt) > at(form.closesAt) ||
    delivery.tasks.length !== form.tasks.length ||
    delivery.tasks.some(
      (task, index) =>
        task.taskId !== form.tasks[index]!.taskId ||
        task.definitionSha256 !== form.tasks[index]!.definitionSha256,
    )
  )
    throw Error("Delivery does not match its frozen due form");
  await rejectWithdrawal(root, frozen.study.id, frozen.study.participantKey);
  const path = resolve(
    await privateFolder(root),
    `${frozen.study.id}.v${frozen.study.version}.${form.phase}.teacher-form.json`,
  );
  await writeFile(path, JSON.stringify(delivery, null, 2) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  return path;
}
