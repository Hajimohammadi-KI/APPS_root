import {
  calculateAutomaticityScore,
  calculateMasteryStatus,
  createEmptyMasteryRecord,
  MASTERY_MODES,
  type MasteryMode,
  type MasteryRecord,
  type MasteryScores,
} from "./mastery";

export const LEGACY_STORAGE_KEY = "GrammarAutomaticityV11_de";

export interface LearnerSettings {
  readonly dailyStudyMinutes: 15 | 30 | 45 | 60;
  readonly minWords: number;
  readonly saveAudio: boolean;
  readonly grammarEngine: "languagetool";
  readonly readingProfile: "standard" | "dyslexia";
  readonly textScale: 100 | 112 | 125;
  readonly readingRuler: boolean;
  readonly lowStimulation: boolean;
  readonly timedChallenges: boolean;
  readonly showStreaks: boolean;
  readonly movementBreaks: boolean;
  readonly ttsRate: number;
  readonly spellingAffectsMastery: boolean;
}

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];
export const PLACEMENT_MODES = ["not_set", "manual", "optional_test"] as const;
export type PlacementMode = (typeof PLACEMENT_MODES)[number];

export interface LearnerProfilePreferences {
  readonly displayName: string;
  readonly avatarDataUrl: string;
  readonly selfDeclaredLevel: CefrLevel | null;
  readonly verifiedLevel: CefrLevel | null;
  readonly placementMode: PlacementMode;
  readonly placementCheckedAt: string | null;
  readonly shareAcrossApps: boolean;
  readonly allowOnlineAI: boolean;
  readonly includeEvidenceInExport: boolean;
}

export interface OutcomeEvidence {
  readonly goal: string;
  readonly baselineScore: number | null;
  readonly followupScore: number | null;
  readonly retentionScore: number | null;
  readonly independentlyRated: boolean;
  readonly assessorNote: string;
}

export const ERROR_CLASSES = [
  "word_order",
  "case",
  "article",
  "auxiliary",
  "ending",
  "tense",
  "agreement",
  "spelling",
  "target_grammar",
  "other",
] as const;

export type ErrorClass = (typeof ERROR_CLASSES)[number];

export const errorClassLabels: Readonly<Record<ErrorClass, string>> = {
  word_order: "Wortstellung",
  case: "Kasus",
  article: "Artikel",
  auxiliary: "Hilfsverb",
  ending: "Endung",
  tense: "Zeitform",
  agreement: "Kongruenz",
  spelling: "Rechtschreibung",
  target_grammar: "Zielgrammatik",
  other: "Sonstiger Fehler",
};

export const REPAIR_STATUSES = [
  "new",
  "scheduled",
  "improving",
  "fixed",
] as const;

export type RepairStatus = (typeof REPAIR_STATUSES)[number];

export const repairStatusLabels: Readonly<Record<RepairStatus, string>> = {
  new: "Neu",
  scheduled: "Eingeplant",
  improving: "In Reparatur",
  fixed: "Stabil repariert",
};

export interface ErrorRecord {
  readonly id: string;
  readonly date: string;
  readonly topic: string;
  readonly original: string;
  readonly corrected: string;
  readonly errorClass: ErrorClass;
  readonly explanation: string;
  readonly occurrenceCount: number;
  readonly lastSeenAt: number;
  readonly repairStatus: RepairStatus;
  readonly nextRepairAt: number;
  readonly successfulRepairs: number;
  readonly critical: boolean;
}

export const REVIEW_SOURCE_TYPES = ["grammar_topic", "error_item"] as const;
export type ReviewSourceType = (typeof REVIEW_SOURCE_TYPES)[number];

export const REVIEW_MODES = ["mixed", "repair", "production", "timed"] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];

export const reviewModeLabels: Readonly<Record<ReviewMode, string>> = {
  mixed: "Gemischt",
  repair: "Reparatur",
  production: "Produktion",
  timed: "8-Sekunden-Abruf",
};

export interface ReviewRecord {
  readonly id: string;
  readonly due: number;
  readonly stage: number;
  readonly topic: string;
  readonly original: string;
  readonly corrected: string;
  readonly mastered?: boolean;
  readonly lastSuccess?: number;
  readonly sourceType: ReviewSourceType;
  readonly sourceId: string;
  readonly successStreak: number;
  readonly stabilityScore: number;
  readonly reviewMode: ReviewMode;
}

export interface SessionRecord {
  readonly id: string;
  readonly date: string;
  readonly topic: {
    readonly topic?: string;
    readonly level?: string;
    readonly category?: string;
  } | null;
  readonly transcript: string;
  readonly corrected: string;
  readonly accuracyScore?: number;
  readonly fluencyScore?: number;
  readonly latencyMs?: number;
}

export interface UserAttempt {
  readonly id: string;
  readonly date: string;
  readonly topic: string;
  readonly mode: MasteryMode;
  readonly inputText: string;
  readonly correctedText: string;
  readonly targetHit: boolean;
  /** False for self-report or unverified offline assessment. */
  readonly verified?: boolean;
  readonly accuracyScore: number;
  readonly fluencyScore?: number;
  readonly latencyMs?: number;
  readonly audioPath?: string;
}

export interface DailyPlanRecord {
  readonly completed: readonly number[];
  readonly answers: Readonly<Record<string, string>>;
}

export interface TodayGrammarRecord {
  readonly title: string;
  readonly level: string;
  readonly date: string;
}

export interface LearnerState {
  readonly settings: LearnerSettings;
  readonly learner: LearnerProfilePreferences;
  readonly outcomes: OutcomeEvidence;
  readonly errors: readonly ErrorRecord[];
  readonly activity: Readonly<Record<string, number>>;
  readonly reviews: readonly ReviewRecord[];
  readonly sessions: readonly SessionRecord[];
  readonly attempts: readonly UserAttempt[];
  readonly mastery: Readonly<Record<string, MasteryRecord>>;
  readonly dailyPlans: Readonly<Record<string, DailyPlanRecord>>;
  readonly learningLevel?: string | null;
  readonly todayGrammar?: TodayGrammarRecord | null;
}

const DEFAULT_SETTINGS: LearnerSettings = {
  dailyStudyMinutes: 15,
  minWords: 12,
  saveAudio: true,
  grammarEngine: "languagetool",
  readingProfile: "dyslexia",
  textScale: 112,
  readingRuler: false,
  lowStimulation: false,
  timedChallenges: false,
  showStreaks: false,
  movementBreaks: true,
  ttsRate: 0.9,
  spellingAffectsMastery: false,
};

const DEFAULT_LEARNER_PROFILE: LearnerProfilePreferences = {
  displayName: "",
  avatarDataUrl: "",
  selfDeclaredLevel: null,
  verifiedLevel: null,
  placementMode: "not_set",
  placementCheckedAt: null,
  shareAcrossApps: true,
  allowOnlineAI: false,
  includeEvidenceInExport: true,
};

const DEFAULT_OUTCOME_EVIDENCE: OutcomeEvidence = {
  goal: "Deutsch spontan, korrekt und verständlich sprechen und schreiben",
  baselineScore: null,
  followupScore: null,
  retentionScore: null,
  independentlyRated: false,
  assessorNote: "",
};

const LEARNING_LEVELS = new Set<string>(CEFR_LEVELS);
const PLACEMENT_MODE_SET = new Set<string>(PLACEMENT_MODES);
const ERROR_CLASS_SET = new Set<string>(ERROR_CLASSES);
const REPAIR_STATUS_SET = new Set<string>(REPAIR_STATUSES);
const REVIEW_SOURCE_TYPE_SET = new Set<string>(REVIEW_SOURCE_TYPES);
const REVIEW_MODE_SET = new Set<string>(REVIEW_MODES);
const MASTERY_MODE_SET = new Set<string>(MASTERY_MODES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function clampScore(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : fallback;
}

function normalizeOutcomeScore(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(Math.min(100, Math.max(0, value)))
    : null;
}

function isStringInSet(value: unknown, values: ReadonlySet<string>): boolean {
  return isString(value) && values.has(value);
}

function normalizeErrors(value: unknown): readonly ErrorRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((row, index) => {
    if (
      !isRecord(row) ||
      !isString(row.date) ||
      !isString(row.topic) ||
      !isString(row.original) ||
      !isString(row.corrected)
    ) {
      return [];
    }
    const seenAt =
      typeof row.lastSeenAt === "number"
        ? row.lastSeenAt
        : Date.parse(row.date) || Date.now();
    const errorClass = isStringInSet(row.errorClass, ERROR_CLASS_SET)
      ? (row.errorClass as ErrorClass)
      : "other";
    const repairStatus = isStringInSet(row.repairStatus, REPAIR_STATUS_SET)
      ? (row.repairStatus as RepairStatus)
      : "new";
    return [
      {
        id: isString(row.id) ? row.id : `legacy-error-${index}`,
        date: row.date,
        topic: row.topic,
        original: row.original,
        corrected: row.corrected,
        errorClass,
        explanation: isString(row.explanation)
          ? row.explanation
          : "Diese Korrektur wurde aus dem bisherigen Fehlerspeicher übernommen.",
        occurrenceCount:
          typeof row.occurrenceCount === "number"
            ? Math.max(1, Math.floor(row.occurrenceCount))
            : 1,
        lastSeenAt: seenAt,
        repairStatus,
        nextRepairAt:
          typeof row.nextRepairAt === "number" ? row.nextRepairAt : seenAt,
        successfulRepairs:
          typeof row.successfulRepairs === "number"
            ? Math.max(0, Math.floor(row.successfulRepairs))
            : 0,
        critical:
          typeof row.critical === "boolean"
            ? row.critical
            : errorClass !== "spelling" && errorClass !== "other",
      },
    ];
  });
}

function normalizeReviews(value: unknown): readonly ReviewRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((row, index) => {
    if (
      !isRecord(row) ||
      !isString(row.topic) ||
      !isString(row.original) ||
      !isString(row.corrected)
    ) {
      return [];
    }
    return [
      {
        id: isString(row.id) ? row.id : `legacy-review-${index}`,
        due: typeof row.due === "number" ? row.due : Date.now(),
        stage:
          typeof row.stage === "number"
            ? Math.max(0, Math.floor(row.stage))
            : 0,
        topic: row.topic,
        original: row.original,
        corrected: row.corrected,
        ...(typeof row.mastered === "boolean"
          ? { mastered: row.mastered }
          : {}),
        ...(typeof row.lastSuccess === "number"
          ? { lastSuccess: row.lastSuccess }
          : {}),
        sourceType: isStringInSet(row.sourceType, REVIEW_SOURCE_TYPE_SET)
          ? (row.sourceType as ReviewSourceType)
          : "grammar_topic",
        sourceId: isString(row.sourceId) ? row.sourceId : row.topic,
        successStreak:
          typeof row.successStreak === "number"
            ? Math.max(0, Math.floor(row.successStreak))
            : 0,
        stabilityScore: clampScore(row.stabilityScore),
        reviewMode: isStringInSet(row.reviewMode, REVIEW_MODE_SET)
          ? (row.reviewMode as ReviewMode)
          : "production",
      },
    ];
  });
}

function normalizeSessions(value: unknown): readonly SessionRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((row, index) => {
    if (
      !isRecord(row) ||
      !isString(row.date) ||
      !isString(row.transcript) ||
      !isString(row.corrected)
    ) {
      return [];
    }
    const topic = isRecord(row.topic)
      ? {
          ...(isString(row.topic.topic) ? { topic: row.topic.topic } : {}),
          ...(isString(row.topic.level) ? { level: row.topic.level } : {}),
          ...(isString(row.topic.category)
            ? { category: row.topic.category }
            : {}),
        }
      : null;
    return [
      {
        id: isString(row.id) ? row.id : `legacy-session-${index}`,
        date: row.date,
        topic,
        transcript: row.transcript,
        corrected: row.corrected,
        ...(typeof row.accuracyScore === "number"
          ? { accuracyScore: clampScore(row.accuracyScore) }
          : {}),
        ...(typeof row.fluencyScore === "number"
          ? { fluencyScore: clampScore(row.fluencyScore) }
          : {}),
        ...(typeof row.latencyMs === "number"
          ? { latencyMs: Math.max(0, Math.round(row.latencyMs)) }
          : {}),
      },
    ];
  });
}

function normalizeAttempts(value: unknown): readonly UserAttempt[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((row, index) => {
    if (
      !isRecord(row) ||
      !isString(row.date) ||
      !isString(row.topic) ||
      !isString(row.inputText) ||
      !isString(row.correctedText) ||
      !isStringInSet(row.mode, MASTERY_MODE_SET) ||
      typeof row.targetHit !== "boolean"
    ) {
      return [];
    }

    return [
      {
        id: isString(row.id) ? row.id : `legacy-attempt-${index}`,
        date: row.date,
        topic: row.topic,
        mode: row.mode as MasteryMode,
        inputText: row.inputText,
        correctedText: row.correctedText,
        targetHit: row.targetHit,
        verified: row.verified === true,
        accuracyScore: clampScore(row.accuracyScore),
        ...(typeof row.fluencyScore === "number"
          ? { fluencyScore: clampScore(row.fluencyScore) }
          : {}),
        ...(typeof row.latencyMs === "number"
          ? { latencyMs: Math.max(0, Math.round(row.latencyMs)) }
          : {}),
        ...(isString(row.audioPath) ? { audioPath: row.audioPath } : {}),
      },
    ];
  });
}

function normalizeActivity(value: unknown): Readonly<Record<string, number>> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([date, amount]) =>
      typeof amount === "number" && Number.isFinite(amount)
        ? [[date, Math.max(0, Math.floor(amount))]]
        : [],
    ),
  );
}

function normalizeMastery(
  value: unknown,
): Readonly<Record<string, MasteryRecord>> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([title, row]) => {
      if (!isRecord(row)) {
        return [];
      }

      const controlled =
        typeof row.controlled === "boolean" ? row.controlled : false;
      const free = typeof row.free === "boolean" ? row.free : false;
      const spoken = typeof row.spoken === "boolean" ? row.spoken : undefined;
      const rawScores = isRecord(row.scores) ? row.scores : null;
      const baseScores: Omit<MasteryScores, "automaticity"> = rawScores
        ? {
            recognition: clampScore(rawScores.recognition),
            writing: clampScore(rawScores.writing),
            speaking: clampScore(rawScores.speaking),
            repair: clampScore(rawScores.repair),
            transfer: clampScore(rawScores.transfer),
          }
        : {
            recognition: controlled ? 100 : 0,
            writing: free ? 80 : 0,
            speaking: spoken ? 80 : 0,
            repair: 0,
            transfer: 0,
          };
      const successfulReviews =
        typeof row.successfulReviews === "number"
          ? Math.max(0, Math.floor(row.successfulReviews))
          : 0;
      const activeCriticalErrors =
        typeof row.activeCriticalErrors === "number"
          ? Math.max(0, Math.floor(row.activeCriticalErrors))
          : 0;
      const responseLatenciesMs = Array.isArray(row.responseLatenciesMs)
        ? row.responseLatenciesMs
            .filter(
              (latency): latency is number =>
                typeof latency === "number" && Number.isFinite(latency),
            )
            .map((latency) => Math.max(0, Math.round(latency)))
            .slice(-10)
        : [];
      const scores: MasteryScores = {
        ...baseScores,
        automaticity: calculateAutomaticityScore(
          baseScores,
          successfulReviews,
          activeCriticalErrors,
          responseLatenciesMs,
        ),
      };
      const calculatedStatus = calculateMasteryStatus(
        scores,
        successfulReviews,
        activeCriticalErrors,
        responseLatenciesMs,
      );
      const empty = createEmptyMasteryRecord();

      return [
        [
          title,
          {
            ...empty,
            status: calculatedStatus,
            scores,
            successfulReviews,
            activeCriticalErrors,
            responseLatenciesMs,
            controlled,
            free,
            ...(spoken === undefined ? {} : { spoken }),
            ...(typeof row.completedAt === "number"
              ? { completedAt: row.completedAt }
              : {}),
            ...(typeof row.lastSuccessAt === "number"
              ? { lastSuccessAt: row.lastSuccessAt }
              : {}),
          },
        ],
      ];
    }),
  );
}

function normalizeDailyPlans(
  value: unknown,
): Readonly<Record<string, DailyPlanRecord>> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([date, row]) => {
      if (!isRecord(row)) {
        return [];
      }
      const answers = isRecord(row.answers)
        ? Object.fromEntries(
            Object.entries(row.answers).flatMap(([key, answer]) =>
              isString(answer) ? [[key, answer]] : [],
            ),
          )
        : {};
      const completed = Array.isArray(row.completed)
        ? [
            ...new Set(
              row.completed.filter(
                (step): step is number =>
                  typeof step === "number" &&
                  Number.isInteger(step) &&
                  step >= 0 &&
                  step <= 6,
              ),
            ),
          ].sort((left, right) => left - right)
        : [];
      return [[date, { completed, answers }]];
    }),
  );
}

export function createInitialLearnerState(): LearnerState {
  return {
    settings: DEFAULT_SETTINGS,
    learner: DEFAULT_LEARNER_PROFILE,
    outcomes: DEFAULT_OUTCOME_EVIDENCE,
    errors: [],
    activity: {},
    reviews: [],
    sessions: [],
    attempts: [],
    mastery: {},
    dailyPlans: {},
    learningLevel: null,
  };
}

export function normalizeLearnerState(value: unknown): LearnerState {
  const initial = createInitialLearnerState();
  if (!isRecord(value)) {
    return initial;
  }

  const settings = isRecord(value.settings) ? value.settings : {};
  const learner = isRecord(value.learner) ? value.learner : {};
  const outcomes = isRecord(value.outcomes) ? value.outcomes : {};
  const todayGrammar = isRecord(value.todayGrammar) ? value.todayGrammar : null;

  return {
    ...initial,
    settings: {
      ...DEFAULT_SETTINGS,
      ...settings,
      grammarEngine: "languagetool",
      dailyStudyMinutes:
        settings.dailyStudyMinutes === 30 ||
        settings.dailyStudyMinutes === 45 ||
        settings.dailyStudyMinutes === 60
          ? settings.dailyStudyMinutes
          : 15,
      minWords:
        typeof settings.minWords === "number"
          ? Math.min(200, Math.max(5, settings.minWords))
          : DEFAULT_SETTINGS.minWords,
      saveAudio:
        typeof settings.saveAudio === "boolean"
          ? settings.saveAudio
          : DEFAULT_SETTINGS.saveAudio,
      readingProfile:
        settings.readingProfile === "standard" ||
        settings.readingProfile === "dyslexia"
          ? settings.readingProfile
          : DEFAULT_SETTINGS.readingProfile,
      textScale:
        settings.textScale === 100 ||
        settings.textScale === 112 ||
        settings.textScale === 125
          ? settings.textScale
          : DEFAULT_SETTINGS.textScale,
      readingRuler:
        typeof settings.readingRuler === "boolean"
          ? settings.readingRuler
          : DEFAULT_SETTINGS.readingRuler,
      lowStimulation:
        typeof settings.lowStimulation === "boolean"
          ? settings.lowStimulation
          : DEFAULT_SETTINGS.lowStimulation,
      timedChallenges:
        typeof settings.timedChallenges === "boolean"
          ? settings.timedChallenges
          : DEFAULT_SETTINGS.timedChallenges,
      showStreaks:
        typeof settings.showStreaks === "boolean"
          ? settings.showStreaks
          : DEFAULT_SETTINGS.showStreaks,
      movementBreaks:
        typeof settings.movementBreaks === "boolean"
          ? settings.movementBreaks
          : DEFAULT_SETTINGS.movementBreaks,
      ttsRate:
        typeof settings.ttsRate === "number" &&
        Number.isFinite(settings.ttsRate)
          ? Math.min(1.5, Math.max(0.6, settings.ttsRate))
          : DEFAULT_SETTINGS.ttsRate,
      spellingAffectsMastery:
        typeof settings.spellingAffectsMastery === "boolean"
          ? settings.spellingAffectsMastery
          : DEFAULT_SETTINGS.spellingAffectsMastery,
    },
    learner: {
      displayName: isString(learner.displayName)
        ? learner.displayName.trim().slice(0, 120)
        : DEFAULT_LEARNER_PROFILE.displayName,
      avatarDataUrl:
        isString(learner.avatarDataUrl) &&
        learner.avatarDataUrl.length <= 350_000 &&
        /^data:image\/(?:jpeg|png|webp);base64,/i.test(learner.avatarDataUrl)
          ? learner.avatarDataUrl
          : DEFAULT_LEARNER_PROFILE.avatarDataUrl,
      selfDeclaredLevel: isStringInSet(
        learner.selfDeclaredLevel,
        LEARNING_LEVELS,
      )
        ? (learner.selfDeclaredLevel as CefrLevel)
        : null,
      verifiedLevel: isStringInSet(learner.verifiedLevel, LEARNING_LEVELS)
        ? (learner.verifiedLevel as CefrLevel)
        : null,
      placementMode: isStringInSet(learner.placementMode, PLACEMENT_MODE_SET)
        ? (learner.placementMode as PlacementMode)
        : isStringInSet(learner.selfDeclaredLevel, LEARNING_LEVELS)
          ? "manual"
          : "not_set",
      placementCheckedAt:
        isString(learner.placementCheckedAt) &&
        Number.isFinite(Date.parse(learner.placementCheckedAt))
          ? new Date(learner.placementCheckedAt).toISOString()
          : null,
      shareAcrossApps:
        typeof learner.shareAcrossApps === "boolean"
          ? learner.shareAcrossApps
          : DEFAULT_LEARNER_PROFILE.shareAcrossApps,
      allowOnlineAI:
        typeof learner.allowOnlineAI === "boolean"
          ? learner.allowOnlineAI
          : DEFAULT_LEARNER_PROFILE.allowOnlineAI,
      includeEvidenceInExport:
        typeof learner.includeEvidenceInExport === "boolean"
          ? learner.includeEvidenceInExport
          : DEFAULT_LEARNER_PROFILE.includeEvidenceInExport,
    },
    outcomes: {
      goal:
        isString(outcomes.goal) && outcomes.goal.trim()
          ? outcomes.goal.trim().slice(0, 240)
          : DEFAULT_OUTCOME_EVIDENCE.goal,
      baselineScore: normalizeOutcomeScore(outcomes.baselineScore),
      followupScore: normalizeOutcomeScore(outcomes.followupScore),
      retentionScore: normalizeOutcomeScore(outcomes.retentionScore),
      independentlyRated:
        typeof outcomes.independentlyRated === "boolean"
          ? outcomes.independentlyRated
          : DEFAULT_OUTCOME_EVIDENCE.independentlyRated,
      assessorNote: isString(outcomes.assessorNote)
        ? outcomes.assessorNote.trim().slice(0, 500)
        : DEFAULT_OUTCOME_EVIDENCE.assessorNote,
    },
    errors: normalizeErrors(value.errors),
    activity: normalizeActivity(value.activity),
    reviews: normalizeReviews(value.reviews),
    sessions: normalizeSessions(value.sessions),
    attempts: normalizeAttempts(value.attempts),
    mastery: normalizeMastery(value.mastery),
    dailyPlans: normalizeDailyPlans(value.dailyPlans),
    learningLevel:
      isString(value.learningLevel) && LEARNING_LEVELS.has(value.learningLevel)
        ? value.learningLevel
        : null,
    todayGrammar:
      todayGrammar &&
      isString(todayGrammar.title) &&
      isString(todayGrammar.level) &&
      isString(todayGrammar.date)
        ? {
            title: todayGrammar.title,
            level: todayGrammar.level,
            date: todayGrammar.date,
          }
        : null,
  };
}

export function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyPlan(
  state: LearnerState,
  dateKey = getTodayKey(),
): DailyPlanRecord {
  return (
    state.dailyPlans[dateKey] ?? {
      completed: [],
      answers: {},
    }
  );
}

export function canCompleteDailyStep(
  completed: readonly number[],
  stepIndex: number,
): boolean {
  return Array.from({ length: stepIndex }, (_, index) => index).every((index) =>
    completed.includes(index),
  );
}

export function calculateStreak(
  activity: Readonly<Record<string, number>>,
  now = new Date(),
): number {
  let streak = 0;

  for (let index = 0; index < 365; index += 1) {
    const date = new Date(now.getTime() - index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    if (activity[date]) {
      streak += 1;
    } else if (index > 0) {
      break;
    }
  }

  return streak;
}

export function countWords(text: string): number {
  return text.match(/\b[\p{L}\p{N}'’-]+\b/gu)?.length ?? 0;
}
