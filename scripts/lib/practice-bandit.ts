import {
  isRecord,
  validDate,
  type AutomaticityEvent,
} from "../../shared/learning-core/src/automaticity/contracts";
import { reduceAutomaticityEvents } from "../../shared/learning-core/src/automaticity/evidence";
import { sha256 } from "../../shared/learning-core/src/automaticity/backup";
import type {
  CurriculumPack,
  PracticeTask,
} from "../../shared/learning-core/src/automaticity/curriculum";

export const BANDIT_VERSION = "practice-bandit-development-1";
export type PracticeArm = "retrieve" | "vary" | "produce";
export interface PracticeDecision {
  id: string;
  at: string;
  policyVersion: string;
  partition: "development";
  language: "en" | "de";
  constructionId: string;
  modality: "writing";
  consent: { recordedAt: string; policyDevelopment: true };
  options: { taskId: string; probability: number }[];
  chosenTaskId: string;
  practiceAttemptId: string;
  probeAttemptId: string | null;
}
export interface BanditObservation {
  decisionId: string;
  context: string;
  arm: PracticeArm;
  taskId: string;
  probability: number;
  reward: 0 | 1;
  observedAt: string;
  probeAttemptId: string;
  options: { taskId: string; arm: PracticeArm; probability: number }[];
}
export interface BanditReplay {
  version: typeof BANDIT_VERSION;
  mode: "offline_development_only";
  active: false;
  observations: BanditObservation[];
  excluded: { id: string; reason: string }[];
  state: Record<
    string,
    Partial<Record<PracticeArm, { successes: number; observations: number }>>
  >;
  readiness: { readyForLiveUse: false; reasons: string[] };
}
const arms: PracticeArm[] = ["retrieve", "vary", "produce"],
  DAY = 86_400_000;
const context = (language: string, construction: string) =>
  `${language}:${construction}:writing`;
export function parsePracticeDecision(value: unknown): PracticeDecision {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    !validDate(value.at) ||
    typeof value.policyVersion !== "string" ||
    !value.policyVersion.trim() ||
    value.partition !== "development" ||
    !["en", "de"].includes(String(value.language)) ||
    value.modality !== "writing" ||
    typeof value.constructionId !== "string" ||
    !value.constructionId.startsWith(`${value.language}.`) ||
    !isRecord(value.consent) ||
    value.consent.policyDevelopment !== true ||
    !validDate(value.consent.recordedAt) ||
    Date.parse(value.consent.recordedAt) > Date.parse(value.at) ||
    !Array.isArray(value.options) ||
    value.options.length < 2 ||
    value.options.length > 50 ||
    typeof value.chosenTaskId !== "string" ||
    typeof value.practiceAttemptId !== "string" ||
    !value.practiceAttemptId.trim() ||
    !(
      value.probeAttemptId === null ||
      (typeof value.probeAttemptId === "string" && value.probeAttemptId.trim())
    )
  )
    throw Error(
      "Invalid development decision, consent, context or outcome link",
    );
  const options = value.options;
  if (
    options.some(
      (option) =>
        !isRecord(option) ||
        typeof option.taskId !== "string" ||
        !option.taskId.trim() ||
        typeof option.probability !== "number" ||
        !Number.isFinite(option.probability) ||
        option.probability < 0 ||
        option.probability > 1,
    ) ||
    new Set(options.map((option) => option.taskId)).size !== options.length ||
    Math.abs(
      options.reduce((total, option) => total + Number(option.probability), 0) -
        1,
    ) > 1e-9 ||
    !options.some(
      (option) =>
        option.taskId === value.chosenTaskId && Number(option.probability) > 0,
    )
  )
    throw Error("Invalid logged action probabilities");
  return value as unknown as PracticeDecision;
}

/** Fit action values only from linked, qualified, delayed and unassisted development probes. */
export async function replayPracticeBandit(
  rawDecisions: readonly unknown[],
  events: readonly AutomaticityEvent[],
  packs: readonly CurriculumPack[],
  now: string,
): Promise<BanditReplay> {
  if (!validDate(now)) throw Error("Invalid replay time");
  const result: BanditReplay = {
    version: BANDIT_VERSION,
    mode: "offline_development_only",
    active: false,
    observations: [],
    excluded: [],
    state: {},
    readiness: {
      readyForLiveUse: false,
      reasons: [
        "A reviewed prospective comparison and demonstrated benefit/non-inferiority are required before activation.",
      ],
    },
  };
  const byId = new Map<string, PracticeDecision>(),
    conflicts = new Set<string>();
  for (const value of rawDecisions) {
    try {
      const decision = parsePracticeDecision(value);
      if (
        byId.has(decision.id) &&
        JSON.stringify(byId.get(decision.id)) !== JSON.stringify(decision)
      )
        conflicts.add(decision.id);
      byId.set(decision.id, decision);
    } catch (error) {
      result.excluded.push({
        id: isRecord(value) ? String(value.id) : "unknown",
        reason: String(error),
      });
    }
  }
  const decisions = [...byId.values()];
  const reductions = {
    en: reduceAutomaticityEvents(
      events.filter((event) => event.language === "en"),
      "en",
      now,
    ),
    de: reduceAutomaticityEvents(
      events.filter((event) => event.language === "de"),
      "de",
      now,
    ),
  };
  const allIds = new Map<string, number>();
  for (const decision of decisions)
    for (const key of ["practiceAttemptId", "probeAttemptId"] as const) {
      const value = decision[key];
      if (value)
        allIds.set(`${key}:${value}`, (allIds.get(`${key}:${value}`) ?? 0) + 1);
    }
  for (const decision of decisions.sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at) || a.id.localeCompare(b.id),
  )) {
    const exclude = (reason: string) =>
      result.excluded.push({ id: decision.id, reason });
    if (conflicts.has(decision.id)) {
      exclude("Conflicting decision ID");
      continue;
    }
    if (Date.parse(decision.at) > Date.parse(now)) {
      exclude("Decision is in the future");
      continue;
    }
    if (!decision.probeAttemptId) {
      exclude("Delayed outcome is missing; it is not a zero reward");
      continue;
    }
    if (
      (allIds.get(`practiceAttemptId:${decision.practiceAttemptId}`) ?? 0) >
        1 ||
      (allIds.get(`probeAttemptId:${decision.probeAttemptId}`) ?? 0) > 1
    ) {
      exclude("One practice/probe cannot reward multiple decisions");
      continue;
    }
    const pack = packs.find((pack) => pack.language === decision.language),
      unit = pack?.units.find((unit) => unit.id === decision.constructionId);
    const tasks = unit?.tasks ?? [],
      options = decision.options.map((option) => ({
        option,
        task: tasks.find((task) => task.id === option.taskId),
      }));
    if (
      !unit ||
      options.some(
        ({ task }) =>
          !task ||
          task.modality !== "writing" ||
          task.partition !== "practice" ||
          task.contentReview !== "human_reviewed" ||
          !arms.includes(task.stage as PracticeArm),
      )
    ) {
      exclude(
        "Choices must be reviewed writing practice in the same construction; due reviews, repairs and final tests cannot be explored",
      );
      continue;
    }
    if (new Set(options.map(({ task }) => task!.stage)).size < 2) {
      exclude("At least two eligible practice strategies are required");
      continue;
    }
    const reduced = reductions[decision.language],
      practice = reduced.attempts.find(
        (row) => row.attempt.id === decision.practiceAttemptId,
      ),
      probe = reduced.attempts.find(
        (row) => row.attempt.id === decision.probeAttemptId,
      );
    const chosen = options.find(
      ({ option }) => option.taskId === decision.chosenTaskId,
    )!;
    if (!practice || !probe) {
      exclude("Linked practice or probe is unavailable");
      continue;
    }
    const probeTask = tasks.find((task) => task.id === probe.attempt.task.id);
    const exact = async (
      attempt: typeof practice.attempt,
      task: PracticeTask | undefined,
    ) =>
      !!task &&
      (
        [
          "id",
          "version",
          "constructionId",
          "familyId",
          "rubricVersion",
          "itemFamily",
          "contextId",
          "stage",
          "modality",
          "partition",
          "transferCondition",
          "contentReview",
        ] as const
      ).every((key) => attempt.task[key] === task[key]) &&
      attempt.task.definitionSha256 === (await sha256(JSON.stringify(task))) &&
      attempt.response.sha256 === (await sha256(attempt.response.text));
    if (
      !(await exact(practice.attempt, chosen.task)) ||
      !(await exact(probe.attempt, probeTask)) ||
      practice.attempt.task.constructionId !== decision.constructionId ||
      practice.attempt.task.modality !== "writing" ||
      Date.parse(practice.attempt.at) < Date.parse(decision.at) ||
      probe.attempt.task.partition !== "calibration" ||
      probeTask?.partition !== "calibration" ||
      !["retain", "transfer"].includes(probe.attempt.task.stage) ||
      probe.attempt.task.constructionId !== decision.constructionId ||
      probe.attempt.task.modality !== "writing"
    ) {
      exclude(
        "Task/response binding or development probe partition does not match",
      );
      continue;
    }
    const quality = probe.assessment;
    const novel =
      probe.attempt.task.transferCondition !== "none" &&
      !reduced.attempts.some(
        (row) =>
          row.attempt.task.constructionId === decision.constructionId &&
          Date.parse(row.attempt.at) < Date.parse(probe.attempt.at) &&
          (row.attempt.task.itemFamily === probe.attempt.task.itemFamily ||
            row.attempt.task.contextId === probe.attempt.task.contextId),
      );
    if (
      !practice.independent ||
      !probe.independent ||
      !quality ||
      quality.uncertainty ||
      !quality.evaluator.scopeApproved ||
      !["pass", "needs_repair", "target_not_observed"].includes(
        quality.verdict,
      ) ||
      (quality.dimensions.opportunities ?? 0) < 1 ||
      probe.attempt.task.contentReview !== "human_reviewed" ||
      (probe.elapsedSincePracticeMs ?? 0) < DAY ||
      !novel ||
      Date.parse(probe.attempt.at) - Date.parse(practice.attempt.at) < DAY
    ) {
      exclude(
        "Reward needs reviewed, independent, novel and actually delayed evidence",
      );
      continue;
    }
    const intervening = events.some(
      (event) =>
        Date.parse(event.at) > Date.parse(practice.attempt.at) &&
        Date.parse(event.at) < Date.parse(probe.attempt.at) &&
        ((event.type === "attempt" &&
          event.task.constructionId === decision.constructionId) ||
          (event.type === "exposure" &&
            event.constructionId === decision.constructionId)) &&
        event.language === decision.language,
    );
    if (intervening) {
      exclude(
        "Intervening practice/exposure prevents attributing this reward to one decision",
      );
      continue;
    }
    result.observations.push({
      decisionId: decision.id,
      context: context(decision.language, decision.constructionId),
      arm: chosen.task!.stage as PracticeArm,
      taskId: decision.chosenTaskId,
      probability: chosen.option.probability,
      reward: quality.verdict === "pass" ? 1 : 0,
      observedAt: probe.assessment!.at,
      probeAttemptId: probe.attempt.id,
      options: options.map(({ option, task }) => ({
        ...option,
        arm: task!.stage as PracticeArm,
      })),
    });
  }
  for (const observation of result.observations) {
    const state = (result.state[observation.context] ??= {}),
      arm = (state[observation.arm] ??= { successes: 0, observations: 0 });
    arm.observations++;
    arm.successes += observation.reward;
  }
  if (!result.observations.length)
    result.readiness.reasons.push(
      "No qualified delayed rewards are available.",
    );
  if (
    result.observations.some((row) =>
      row.options.some((option) => option.probability === 0),
    )
  )
    result.readiness.reasons.push(
      "Deterministic logs lack action overlap for an alternative policy comparison.",
    );
  result.readiness.reasons.push(
    "Counts and simulated recommendations do not establish learner benefit or adequate statistical power.",
  );
  return result;
}

/** Small tabular contextual bandit. It returns a shadow distribution; it never changes the app's plan. */
export function suggestPracticePolicy(
  replay: BanditReplay,
  contextKey: string,
  options: { taskId: string; arm: PracticeArm }[],
  epsilon = 0.1,
) {
  if (
    !Number.isFinite(epsilon) ||
    epsilon < 0 ||
    epsilon > 0.1 ||
    options.length < 2 ||
    new Set(options.map((option) => option.taskId)).size !== options.length ||
    options.some((option) => !arms.includes(option.arm))
  )
    throw Error("Invalid bounded exploration configuration");
  const state = replay.state[contextKey] ?? {},
    availableArms = [...new Set(options.map((option) => option.arm))];
  const score = (arm: PracticeArm) =>
    ((state[arm]?.successes ?? 0) + 1) / ((state[arm]?.observations ?? 0) + 2);
  const best = Math.max(...availableArms.map(score)),
    winners = availableArms.filter((arm) => score(arm) === best);
  return {
    version: BANDIT_VERSION,
    active: false as const,
    mode: "shadow_recommendation" as const,
    options: options.map((option) => ({
      ...option,
      probability:
        (epsilon / availableArms.length +
          (winners.includes(option.arm) ? (1 - epsilon) / winners.length : 0)) /
        options.filter((other) => other.arm === option.arm).length,
    })),
  };
}

/** IPS diagnostics are unavailable without overlap; missing outcomes never enter the denominator. */
export function evaluatePracticePolicy(
  observations: readonly BanditObservation[],
  target: (row: BanditObservation) => { taskId: string; probability: number }[],
) {
  let numerator = 0,
    squared = 0,
    total = 0;
  if (!observations.length)
    return {
      available: false,
      reason: "No qualified observed rewards",
      estimate: null,
      effectiveSampleSize: 0,
      learnerBenefitEstablished: false,
    };
  for (const row of observations) {
    const probabilities = target(row);
    if (
      probabilities.length !== row.options.length ||
      new Set(probabilities.map((option) => option.taskId)).size !==
        probabilities.length ||
      probabilities.some(
        (option) =>
          !Number.isFinite(option.probability) ||
          option.probability < 0 ||
          option.probability > 1 ||
          !row.options.some((old) => old.taskId === option.taskId),
      ) ||
      Math.abs(
        probabilities.reduce((sum, option) => sum + option.probability, 0) - 1,
      ) > 1e-9
    )
      throw Error("Invalid target policy distribution");
    if (
      row.options.some(
        (option) =>
          option.probability === 0 &&
          probabilities.some(
            (target) =>
              target.taskId === option.taskId && target.probability > 0,
          ),
      )
    )
      return {
        available: false,
        reason: "No action overlap: counterfactual rewards cannot be inferred",
        estimate: null,
        effectiveSampleSize: 0,
        learnerBenefitEstablished: false,
      };
    const weight =
      probabilities.find((option) => option.taskId === row.taskId)!
        .probability / row.probability;
    numerator += weight * row.reward;
    total += weight;
    squared += weight * weight;
  }
  return {
    available: total > 0,
    reason:
      "Descriptive IPS arithmetic only; target policy must be frozen on separate data for evaluation",
    estimate: total > 0 ? numerator / observations.length : null,
    effectiveSampleSize: squared > 0 ? (total * total) / squared : 0,
    learnerBenefitEstablished: false,
  };
}
