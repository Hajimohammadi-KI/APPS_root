import { AUTOMATICITY_LATENCY_THRESHOLD_MS } from "./mastery";
import type { UserAttempt } from "./learner-state";

// The Automatisierungstrainer (retrieval practice / oral shadowing /
// formulaic-sequence drills) deliberately does NOT introduce a second
// attempt-tracking store. It tags each practice attempt's `topic` with a
// small encoded convention and records it through the same
// `recordAttempt`/`UserAttempt` path every other feature already uses
// (see learner-state-provider.tsx). This module only adds the encoding
// helpers and the read-side aggregation (the 4-week matrix) on top of that
// existing shape.

export const AUTOMATIZATION_MODULES = [
  "retrieval",
  "shadowing",
  "formulaic",
  // Not a practice module in its own right -- the 4-day self-check recap
  // (see computeAutomatizationMatrix's caller in automatization-trainer.tsx)
  // is recorded through the exact same topic-encoding/attempts path so it
  // never needs a second storage system, just a fourth namespace value.
  "checkpoint",
] as const;
export type AutomatizationModule = (typeof AUTOMATIZATION_MODULES)[number];

export const automatizationModuleLabels: Readonly<
  Record<AutomatizationModule, string>
> = {
  retrieval: "Abrufübung",
  shadowing: "Schattensprechen",
  formulaic: "Redewendungen",
  checkpoint: "4-Tage-Checkpoint",
};

// The 5-stage shadowing progression is the user's own pedagogical spec:
// meaning-focused single listen, slow shadowing, precise shadowing with
// transcript, delayed shadowing (held in working memory), and free
// retelling with the audio off. Each stage is tracked as its own attempt
// so progression through all five is visible, not just "shadowing done".
export const SHADOWING_STAGES = [1, 2, 3, 4, 5] as const;
export type ShadowingStage = (typeof SHADOWING_STAGES)[number];

export const shadowingStageLabels: Readonly<Record<ShadowingStage, string>> = {
  1: "Hören für den Sinn",
  2: "Langsames Shadowing",
  3: "Präzises Shadowing",
  4: "Verzögertes Shadowing",
  5: "Freies Nacherzählen",
};

const TOPIC_PREFIX = "Automatisierung";

function sanitizeTopicSegment(value: string): string {
  return value.trim().replace(/:/g, "-");
}

/**
 * Encodes a practice attempt's identity into the `topic` field every
 * `UserAttempt` already carries, so the trainer can persist through
 * `recordAttempt` without any new state shape. `parseAutomatizationTopic`
 * is the exact inverse.
 */
export function buildAutomatizationTopic(
  module: AutomatizationModule,
  itemId: string,
  stage?: ShadowingStage,
): string {
  const segment = sanitizeTopicSegment(itemId);
  return module === "shadowing" && stage !== undefined
    ? `${TOPIC_PREFIX}:${module}:${segment}:stufe${stage}`
    : `${TOPIC_PREFIX}:${module}:${segment}`;
}

export interface ParsedAutomatizationTopic {
  readonly module: AutomatizationModule;
  readonly itemId: string;
  readonly stage: ShadowingStage | null;
}

export function parseAutomatizationTopic(
  topic: string,
): ParsedAutomatizationTopic | null {
  if (!topic.startsWith(`${TOPIC_PREFIX}:`)) return null;
  const parts = topic.split(":");
  const moduleRaw = parts[1];
  const itemId = parts[2];
  const stageRaw = parts[3];
  if (!moduleRaw || !itemId) return null;
  if (!(AUTOMATIZATION_MODULES as readonly string[]).includes(moduleRaw)) {
    return null;
  }
  const module = moduleRaw as AutomatizationModule;
  let stage: ShadowingStage | null = null;
  if (stageRaw) {
    const match = /^stufe([1-5])$/.exec(stageRaw);
    if (match) {
      stage = Number(match[1]) as ShadowingStage;
    }
  }
  return { module, itemId, stage };
}

/** Matrix column keys: the three modules, with shadowing split by stage. */
export type AutomatizationMatrixColumnKey =
  "retrieval" | "formulaic" | `shadowing-${ShadowingStage}`;

export interface AutomatizationMatrixColumn {
  readonly key: AutomatizationMatrixColumnKey;
  readonly label: string;
}

export const AUTOMATIZATION_MATRIX_COLUMNS: readonly AutomatizationMatrixColumn[] =
  [
    { key: "retrieval", label: automatizationModuleLabels.retrieval },
    { key: "formulaic", label: automatizationModuleLabels.formulaic },
    ...SHADOWING_STAGES.map((stage) => ({
      key: `shadowing-${stage}` as const,
      label: `${automatizationModuleLabels.shadowing} · ${shadowingStageLabels[stage]}`,
    })),
  ];

function matrixColumnKeyFor(
  parsed: ParsedAutomatizationTopic,
): AutomatizationMatrixColumnKey | null {
  if (parsed.module === "shadowing") {
    return parsed.stage ? (`shadowing-${parsed.stage}` as const) : null;
  }
  if (parsed.module === "checkpoint") {
    // Checkpoint self-checks live in the same attempts stream (see
    // AUTOMATIZATION_MODULES) but are surfaced as their own list next to
    // the matrix, not as a grid column.
    return null;
  }
  return parsed.module;
}

export interface AutomatizationMatrixCell {
  readonly attempts: number;
  readonly verifiedAttempts: number;
  /** Attempts that were verified, hit the target, and stayed within the
   * shared automaticity latency threshold -- consistent with the same
   * "automatic" concept mastery.ts already gates on, not a competing one. */
  readonly automaticAttempts: number;
}

function emptyCell(): AutomatizationMatrixCell {
  return { attempts: 0, verifiedAttempts: 0, automaticAttempts: 0 };
}

export interface AutomatizationMatrixRow {
  readonly weekStart: string;
  readonly weekLabel: string;
  readonly cells: Readonly<
    Record<AutomatizationMatrixColumnKey, AutomatizationMatrixCell>
  >;
}

const WEEK_MS = 7 * 86_400_000;
export const AUTOMATIZATION_MATRIX_WEEKS = 4;

/**
 * Aggregates Automatisierungstrainer attempts into a rolling 4-week
 * matrix (module/stage x week). Reads directly off `state.attempts` --
 * no separate tracking store.
 */
export function computeAutomatizationMatrix(
  attempts: readonly UserAttempt[],
  now: Date = new Date(),
): readonly AutomatizationMatrixRow[] {
  const rows: AutomatizationMatrixRow[] = [];
  const nowMs = now.getTime();

  for (
    let weeksAgo = AUTOMATIZATION_MATRIX_WEEKS - 1;
    weeksAgo >= 0;
    weeksAgo -= 1
  ) {
    // Half-open [start, end) windows avoid double-counting an attempt that
    // lands exactly on a week boundary -- except the outer edge, where "now"
    // itself must fall inside the current week rather than being excluded
    // by it being the boundary's own end.
    const end = weeksAgo === 0 ? nowMs + 1 : nowMs - weeksAgo * WEEK_MS;
    const start = (weeksAgo === 0 ? nowMs : end) - WEEK_MS;
    const cells = Object.fromEntries(
      AUTOMATIZATION_MATRIX_COLUMNS.map((column) => [column.key, emptyCell()]),
    ) as Record<AutomatizationMatrixColumnKey, AutomatizationMatrixCell>;

    for (const attempt of attempts) {
      const parsed = parseAutomatizationTopic(attempt.topic);
      if (!parsed) continue;
      const columnKey = matrixColumnKeyFor(parsed);
      if (!columnKey) continue;
      const timestamp = Date.parse(attempt.date);
      if (
        !Number.isFinite(timestamp) ||
        timestamp < start ||
        timestamp >= end
      ) {
        continue;
      }
      const cell = cells[columnKey];
      const verified = attempt.verified === true;
      const fastEnough =
        attempt.latencyMs !== undefined &&
        attempt.latencyMs <= AUTOMATICITY_LATENCY_THRESHOLD_MS;
      cells[columnKey] = {
        attempts: cell.attempts + 1,
        verifiedAttempts: cell.verifiedAttempts + (verified ? 1 : 0),
        automaticAttempts:
          cell.automaticAttempts +
          (verified && attempt.targetHit && fastEnough ? 1 : 0),
      };
    }

    rows.push({
      weekStart: new Date(start).toISOString().slice(0, 10),
      weekLabel:
        weeksAgo === 0
          ? "Diese Woche"
          : `Vor ${weeksAgo} Woche${weeksAgo > 1 ? "n" : ""}`,
      cells,
    });
  }

  return rows;
}
