"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import {
  canCompleteDailyStep,
  createInitialLearnerState,
  getDailyPlan,
  getNextReviewDate,
  getReviewProgressAfterResult,
  getTodayKey,
  LEGACY_STORAGE_KEY,
  normalizeLearnerState,
  recordMasteryAttempt,
  recordMasteryReview,
  setMasteryCriticalErrors,
  type ErrorClass,
  type ErrorRecord,
  type LearnerProfilePreferences,
  type LearnerSettings,
  type LearnerState,
  type MasteryRecord,
  type OutcomeEvidence,
  type ReviewMode,
  type ReviewConfidence,
  type ReviewSourceType,
  type SessionRecord,
  type UserAttempt,
} from "@grammar/domain";
import { grammarUnits } from "@grammar/content";
import {
  fsrsShadowRatingFromResult,
  recordFsrsShadowReview,
} from "@automaticity/learning-core";
import {
  learnerStateCalendarEvents,
  readDesktopCalendarStatus,
} from "@/lib/desktop-calendar";
import {
  emptyEvidenceSummary,
  mergeLearnerProfile,
  readLearnerProfile,
  type EvidenceSummary,
} from "@/lib/learner-profile";

interface CreateErrorInput {
  readonly topic: string;
  readonly original: string;
  readonly corrected: string;
  readonly errorClass: ErrorClass;
  readonly explanation: string;
  readonly critical?: boolean;
}

interface ReviewOptions {
  readonly sourceType?: ReviewSourceType;
  readonly sourceId?: string;
  readonly reviewMode?: ReviewMode;
}

interface LearnerStateContextValue {
  readonly state: LearnerState;
  readonly hydrated: boolean;
  readonly updateSettings: (settings: Partial<LearnerSettings>) => void;
  readonly updateLearnerProfile: (
    learner: Partial<LearnerProfilePreferences>,
  ) => void;
  readonly updateOutcomeEvidence: (outcomes: Partial<OutcomeEvidence>) => void;
  readonly setTodayGrammar: (title: string, level: string) => void;
  readonly setDailyAnswer: (answerId: string, value: string) => void;
  readonly completeDailyStep: (stepIndex: number) => void;
  readonly markActivity: (minimum: number) => void;
  readonly addError: (error: CreateErrorInput) => void;
  readonly addSession: (session: Omit<SessionRecord, "id" | "date">) => void;
  readonly recordAttempt: (attempt: Omit<UserAttempt, "id" | "date">) => void;
  readonly scheduleReview: (
    topic: string,
    original: string,
    corrected: string,
    options?: ReviewOptions,
  ) => void;
  readonly advanceReview: (reviewId: string) => void;
  readonly completeReview: (
    reviewId: string,
    successful: boolean,
    confidence?: ReviewConfidence,
  ) => void;
  readonly recordErrorRepair: (errorId: string, successful: boolean) => void;
  readonly setMastery: (title: string, mastery: MasteryRecord) => void;
  readonly importState: (value: unknown) => void;
  readonly resetState: () => void;
}

const LearnerStateContext = createContext<LearnerStateContextValue | null>(
  null,
);

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

const DAY_IN_MILLISECONDS = 86_400_000;

function countActiveCriticalErrors(
  errors: readonly ErrorRecord[],
  topic: string,
): number {
  return errors.filter(
    (error) =>
      error.topic === topic && error.critical && error.repairStatus !== "fixed",
  ).length;
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const recent = values.slice(-10);
  return Math.round(
    recent.reduce((total, value) => total + value, 0) / recent.length,
  );
}

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

function deriveVerifiedLevel(
  state: LearnerState,
): LearnerState["learner"]["verifiedLevel"] {
  let verified: LearnerState["learner"]["verifiedLevel"] = null;

  for (const level of CEFR_ORDER) {
    const levelTitles = grammarUnits
      .filter((unit) => unit.level === level)
      .map((unit) => unit.title);
    if (levelTitles.length === 0) break;
    const titleSet = new Set(levelTitles);
    const allAutomatic = levelTitles.every(
      (title) => state.mastery[title]?.status === "automatic",
    );
    if (!allAutomatic) break;

    const activeCriticalErrors = state.errors.filter(
      (error) =>
        titleSet.has(error.topic) &&
        error.critical &&
        error.repairStatus !== "fixed",
    ).length;
    if (activeCriticalErrors > 0) break;

    const successful = state.attempts.filter(
      (attempt) =>
        titleSet.has(attempt.topic) &&
        attempt.verified === true &&
        attempt.targetHit &&
        attempt.accuracyScore >= 80,
    );
    const speaking = successful.filter(
      (attempt) => attempt.mode === "speaking",
    );
    const writing = successful.filter((attempt) => attempt.mode === "writing");
    const transfer = successful.filter(
      (attempt) => attempt.mode === "transfer",
    );
    const minimumSamples = Math.max(6, Math.ceil(levelTitles.length * 0.5));
    if (
      speaking.length < minimumSamples ||
      writing.length < minimumSamples ||
      transfer.length < minimumSamples
    ) {
      break;
    }

    verified = level;
  }

  return verified;
}

function withAutomaticVerifiedLevel(state: LearnerState): LearnerState {
  const nextVerified = state.learner.selfDeclaredLevel
    ? deriveVerifiedLevel(state)
    : null;
  if (state.learner.verifiedLevel === nextVerified) {
    return state;
  }
  return {
    ...state,
    learner: {
      ...state.learner,
      verifiedLevel: nextVerified,
    },
  };
}

export function buildGermanEvidence(state: LearnerState): EvidenceSummary {
  const level = state.learner.selfDeclaredLevel;
  if (!level) return emptyEvidenceSummary();
  const titles = new Set(
    grammarUnits
      .filter((unit) => unit.level === level)
      .map((unit) => unit.title),
  );
  const attempts = state.attempts.filter((attempt) =>
    titles.has(attempt.topic),
  );
  const speaking = attempts.filter((attempt) => attempt.mode === "speaking");
  const writing = attempts.filter((attempt) => attempt.mode === "writing");
  const mastery = Object.entries(state.mastery)
    .filter(([title]) => titles.has(title))
    .map(([, record]) => record);
  const successful = (attempt: UserAttempt) =>
    attempt.verified === true &&
    attempt.targetHit &&
    attempt.accuracyScore >= 80;
  const dailyRows = new Map<
    string,
    {
      date: string;
      practiceCount: number;
      speakingSamples: number;
      writingSamples: number;
      spontaneousSamples: number;
      delayedReviews: number;
      averageScore: number | null;
      scores: number[];
    }
  >();
  for (const [date, practiceCount] of Object.entries(state.activity)) {
    dailyRows.set(date, {
      date,
      practiceCount,
      speakingSamples: 0,
      writingSamples: 0,
      spontaneousSamples: 0,
      delayedReviews: 0,
      averageScore: null,
      scores: [],
    });
  }
  for (const attempt of attempts) {
    const date = attempt.date.slice(0, 10);
    const row = dailyRows.get(date) ?? {
      date,
      practiceCount: 0,
      speakingSamples: 0,
      writingSamples: 0,
      spontaneousSamples: 0,
      delayedReviews: 0,
      averageScore: null,
      scores: [],
    };
    row.practiceCount += 1;
    row.scores.push(attempt.accuracyScore);
    if (successful(attempt) && attempt.mode === "speaking") {
      row.speakingSamples += 1;
    }
    if (successful(attempt) && attempt.mode === "writing") {
      row.writingSamples += 1;
    }
    if (
      successful(attempt) &&
      (attempt.mode === "speaking" || attempt.mode === "transfer")
    ) {
      row.spontaneousSamples += 1;
    }
    dailyRows.set(date, row);
  }
  return {
    speakingSamples: speaking.filter(successful).length,
    writingSamples: writing.filter(successful).length,
    spontaneousSamples: attempts.filter(
      (attempt) =>
        successful(attempt) &&
        (attempt.mode === "speaking" || attempt.mode === "transfer"),
    ).length,
    delayedReviews: mastery.reduce(
      (total, record) => total + record.successfulReviews,
      0,
    ),
    criticalErrorCount: state.errors.filter(
      (error) =>
        titles.has(error.topic) &&
        error.critical &&
        error.repairStatus !== "fixed",
    ).length,
    dailyActivity: [...dailyRows.values()]
      .map(({ scores, ...row }) => ({
        ...row,
        averageScore: scores.length
          ? Math.round(
              scores.reduce((total, value) => total + value, 0) / scores.length,
            )
          : null,
      }))
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-90),
    scores: {
      listening: null,
      reading: null,
      spoken_interaction: average(
        mastery.map((record) => record.scores.speaking),
      ),
      spoken_production: average(
        mastery.map((record) => record.scores.speaking),
      ),
      writing: average(mastery.map((record) => record.scores.writing)),
      grammar: average(mastery.map((record) => record.scores.automaticity)),
      vocabulary: null,
      pronunciation: null,
      fluency: average(
        speaking.flatMap((attempt) =>
          attempt.fluencyScore === undefined ? [] : [attempt.fluencyScore],
        ),
      ),
    },
  };
}

export function LearnerStateProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<LearnerState>(createInitialLearnerState);
  const [hydrated, setHydrated] = useState(false);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    let nextState: LearnerState;
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      nextState = normalizeLearnerState(stored ? JSON.parse(stored) : null);
    } catch {
      nextState = createInitialLearnerState();
    }
    const timer = window.setTimeout(() => {
      setState(nextState);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    if (hydrated) {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));
    }
  }, [hydrated, state]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.readingProfile = state.settings.readingProfile;
    root.dataset.textScale = String(state.settings.textScale);
    root.dataset.lowStimulation = String(state.settings.lowStimulation);
  }, [
    state.settings.lowStimulation,
    state.settings.readingProfile,
    state.settings.textScale,
  ]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void readLearnerProfile()
      .then((profile) => {
        if (cancelled) return;
        setState((current) => {
          const shared = profile.languages.german;
          return normalizeLearnerState({
            ...current,
            settings: {
              ...current.settings,
              saveAudio: profile.privacy.storeAudio,
            },
            learner: {
              ...current.learner,
              displayName: profile.displayName || current.learner.displayName,
              avatarDataUrl: profile.avatarDataUrl,
              selfDeclaredLevel: profile.privacy.shareAcrossApps
                ? (shared.selfDeclaredLevel ??
                  current.learner.selfDeclaredLevel)
                : current.learner.selfDeclaredLevel,
              verifiedLevel: profile.privacy.shareAcrossApps
                ? shared.verifiedLevel
                : current.learner.verifiedLevel,
              placementMode: profile.privacy.shareAcrossApps
                ? shared.placementMode
                : current.learner.placementMode,
              placementCheckedAt: profile.privacy.shareAcrossApps
                ? shared.placementCheckedAt
                : current.learner.placementCheckedAt,
              shareAcrossApps: profile.privacy.shareAcrossApps,
              allowOnlineAI: profile.privacy.allowOnlineAI,
              includeEvidenceInExport: profile.privacy.includeEvidenceInExport,
            },
          });
        });
        setProfileReady(true);
      })
      .catch(() => setProfileReady(true));
    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !profileReady) return;
    const timer = window.setTimeout(() => {
      void mergeLearnerProfile({
        displayName: state.learner.displayName,
        avatarDataUrl: state.learner.avatarDataUrl,
        privacy: {
          shareAcrossApps: state.learner.shareAcrossApps,
          allowOnlineAI: state.learner.allowOnlineAI,
          storeAudio: state.settings.saveAudio,
          includeEvidenceInExport: state.learner.includeEvidenceInExport,
        },
        ...(state.learner.shareAcrossApps
          ? {
              language: "german" as const,
              track: {
                selfDeclaredLevel: state.learner.selfDeclaredLevel,
                verifiedLevel: state.learner.verifiedLevel,
                placementMode: state.learner.placementMode,
                placementCheckedAt: state.learner.placementCheckedAt,
                evidence: buildGermanEvidence(state),
              },
            }
          : {}),
      }).catch(() => undefined);
    }, 750);
    return () => window.clearTimeout(timer);
  }, [hydrated, profileReady, state]);

  useEffect(() => {
    if (!hydrated || !profileReady) return;
    let cancelled = false;
    const refreshIdentity = () => {
      void readLearnerProfile()
        .then((profile) => {
          if (cancelled) return;
          setState((current) =>
            normalizeLearnerState({
              ...current,
              learner: {
                ...current.learner,
                displayName: profile.displayName,
                avatarDataUrl: profile.avatarDataUrl,
              },
            }),
          );
        })
        .catch(() => undefined);
    };
    window.addEventListener("focus", refreshIdentity);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshIdentity);
    };
  }, [hydrated, profileReady]);

  useEffect(() => {
    if (!hydrated || !window.studyCalendar) {
      return;
    }
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const calendar = await readDesktopCalendarStatus();
          if (calendar.connected) {
            await window.studyCalendar?.sync(learnerStateCalendarEvents(state));
          }
        } catch {
          // A manual sync in Einstellungen reports actionable Google errors.
        }
      })();
    }, 2_500);
    return () => window.clearTimeout(timer);
  }, [hydrated, state]);

  useEffect(() => {
    if (!hydrated) return;
    setState((current) => withAutomaticVerifiedLevel(current));
  }, [
    hydrated,
    state.attempts,
    state.errors,
    state.mastery,
    state.learner.selfDeclaredLevel,
  ]);

  useEffect(() => {
    function syncFromAnotherTab(event: StorageEvent) {
      if (event.key !== LEGACY_STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        setState(normalizeLearnerState(JSON.parse(event.newValue)));
      } catch {
        // Ignore malformed state written by another tab.
      }
    }

    window.addEventListener("storage", syncFromAnotherTab);
    return () => window.removeEventListener("storage", syncFromAnotherTab);
  }, []);

  const updateSettings = useCallback((settings: Partial<LearnerSettings>) => {
    setState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...settings,
        grammarEngine: "languagetool",
      },
    }));
  }, []);

  const updateLearnerProfile = useCallback(
    (learner: Partial<LearnerProfilePreferences>) => {
      setState((current) => ({
        ...current,
        learner: {
          ...current.learner,
          ...learner,
        },
      }));
    },
    [],
  );

  const updateOutcomeEvidence = useCallback(
    (outcomes: Partial<OutcomeEvidence>) => {
      setState((current) => ({
        ...current,
        outcomes: {
          ...current.outcomes,
          ...outcomes,
        },
      }));
    },
    [],
  );

  const setTodayGrammar = useCallback((title: string, level: string) => {
    setState((current) => {
      const dateKey = getTodayKey();
      const grammarChanged =
        current.todayGrammar?.date !== dateKey ||
        current.todayGrammar.title !== title;

      return {
        ...current,
        learningLevel: level,
        todayGrammar: {
          title,
          level,
          date: dateKey,
        },
        dailyPlans: grammarChanged
          ? {
              ...current.dailyPlans,
              [dateKey]: {
                completed: [],
                answers: {},
              },
            }
          : current.dailyPlans,
      };
    });
  }, []);

  const setDailyAnswer = useCallback((answerId: string, value: string) => {
    setState((current) => {
      const dateKey = getTodayKey();
      const plan = getDailyPlan(current, dateKey);
      return {
        ...current,
        dailyPlans: {
          ...current.dailyPlans,
          [dateKey]: {
            ...plan,
            answers: {
              ...plan.answers,
              [answerId]: value,
            },
          },
        },
      };
    });
  }, []);

  const completeDailyStep = useCallback((stepIndex: number) => {
    setState((current) => {
      const dateKey = getTodayKey();
      const plan = getDailyPlan(current, dateKey);
      if (
        !canCompleteDailyStep(plan.completed, stepIndex) ||
        plan.completed.includes(stepIndex)
      ) {
        return current;
      }

      const completed = [...plan.completed, stepIndex].sort(
        (left, right) => left - right,
      );
      return {
        ...current,
        activity: {
          ...current.activity,
          [dateKey]: completed.length,
        },
        dailyPlans: {
          ...current.dailyPlans,
          [dateKey]: {
            ...plan,
            completed,
            answers:
              stepIndex === 0
                ? { ...plan.answers, "planner:yesterday-recalled": "1" }
                : plan.answers,
          },
        },
      };
    });
  }, []);

  const markActivity = useCallback((minimum: number) => {
    setState((current) => {
      const dateKey = getTodayKey();
      return {
        ...current,
        activity: {
          ...current.activity,
          [dateKey]: Math.max(current.activity[dateKey] ?? 0, minimum),
        },
      };
    });
  }, []);

  const addError = useCallback((error: CreateErrorInput) => {
    setState((current) => {
      const now = Date.now();
      const existing = current.errors.find(
        (row) =>
          row.topic === error.topic &&
          row.errorClass === error.errorClass &&
          row.repairStatus !== "fixed",
      );
      const errorId = existing?.id ?? createId("error");
      const nextErrors: readonly ErrorRecord[] = existing
        ? current.errors.map((row) =>
            row.id === existing.id
              ? {
                  ...row,
                  date: new Date(now).toISOString(),
                  original: error.original,
                  corrected: error.corrected,
                  explanation: error.explanation,
                  occurrenceCount: row.occurrenceCount + 1,
                  lastSeenAt: now,
                  repairStatus: "scheduled",
                  nextRepairAt: now,
                  critical: error.critical ?? row.critical,
                }
              : row,
          )
        : [
            ...current.errors,
            {
              id: errorId,
              date: new Date(now).toISOString(),
              topic: error.topic,
              original: error.original,
              corrected: error.corrected,
              errorClass: error.errorClass,
              explanation: error.explanation,
              occurrenceCount: 1,
              lastSeenAt: now,
              repairStatus: "new",
              nextRepairAt: now,
              successfulRepairs: 0,
              critical: error.critical ?? error.errorClass !== "spelling",
            },
          ];
      const reviewExists = current.reviews.some(
        (review) =>
          review.sourceType === "error_item" &&
          review.sourceId === errorId &&
          !review.mastered,
      );

      return {
        ...current,
        errors: nextErrors,
        reviews: reviewExists
          ? current.reviews
          : [
              ...current.reviews,
              {
                id: createId("review"),
                due: now + DAY_IN_MILLISECONDS,
                stage: 0,
                topic: error.topic,
                original: error.original,
                corrected: error.corrected,
                mastered: false,
                sourceType: "error_item",
                sourceId: errorId,
                successStreak: 0,
                stabilityScore: 0,
                reviewMode: "repair",
              },
            ],
        mastery: {
          ...current.mastery,
          [error.topic]: setMasteryCriticalErrors(
            current.mastery[error.topic],
            countActiveCriticalErrors(nextErrors, error.topic),
          ),
        },
      };
    });
  }, []);

  const addSession = useCallback(
    (session: Omit<SessionRecord, "id" | "date">) => {
      setState((current) => ({
        ...current,
        sessions: [
          ...current.sessions,
          {
            ...session,
            id: createId("session"),
            date: new Date().toISOString(),
          },
        ],
      }));
    },
    [],
  );

  const recordAttempt = useCallback(
    (attempt: Omit<UserAttempt, "id" | "date">) => {
      setState((current) => {
        const now = Date.now();
        const row: UserAttempt = {
          ...attempt,
          id: createId("attempt"),
          date: new Date(now).toISOString(),
        };
        return {
          ...current,
          attempts: [...current.attempts, row].slice(-1_000),
          mastery:
            attempt.verified === true
              ? {
                  ...current.mastery,
                  [attempt.topic]: recordMasteryAttempt(
                    current.mastery[attempt.topic],
                    {
                      mode: attempt.mode,
                      accuracyScore: attempt.accuracyScore,
                      targetHit: attempt.targetHit,
                      ...(attempt.latencyMs === undefined
                        ? {}
                        : { latencyMs: attempt.latencyMs }),
                      createdAt: now,
                    },
                  ),
                }
              : current.mastery,
        };
      });
    },
    [],
  );

  const scheduleReview = useCallback(
    (
      topic: string,
      original: string,
      corrected: string,
      options: ReviewOptions = {},
    ) => {
      const now = new Date();
      const sourceType = options.sourceType ?? "grammar_topic";
      const sourceId = options.sourceId ?? topic;
      setState((current) => {
        if (
          current.reviews.some(
            (review) =>
              review.sourceType === sourceType &&
              review.sourceId === sourceId &&
              !review.mastered,
          )
        ) {
          return current;
        }
        return {
          ...current,
          reviews: [
            ...current.reviews,
            {
              id: createId("review"),
              due: getNextReviewDate(now, 0)?.getTime() ?? now.getTime(),
              stage: 0,
              topic,
              original,
              corrected,
              mastered: false,
              sourceType,
              sourceId,
              successStreak: 0,
              stabilityScore: 0,
              reviewMode: options.reviewMode ?? "production",
            },
          ],
        };
      });
    },
    [],
  );

  const completeReview = useCallback(
    (
      reviewId: string,
      successful: boolean,
      confidence: ReviewConfidence = "good",
    ) => {
      const reviewedAt = new Date();
      const shadowEventId = `fsrs-shadow:${crypto.randomUUID()}`;
      const selectedForShadow = state.reviews.find(
        (review) => review.id === reviewId,
      );
      const shadowProgress = selectedForShadow
        ? getReviewProgressAfterResult(
            selectedForShadow.stage,
            successful,
            reviewedAt,
            confidence,
          )
        : null;
      setState((current) => {
        const selected = current.reviews.find(
          (review) => review.id === reviewId,
        );
        if (!selected) {
          return current;
        }
        const now = reviewedAt;
        const progress = getReviewProgressAfterResult(
          selected.stage,
          successful,
          now,
          confidence,
        );
        const reviewModes: readonly ReviewMode[] = [
          "production",
          "timed",
          "mixed",
          "mixed",
          "mixed",
        ];
        const nextReviews = current.reviews.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                stage: progress.stage,
                due: progress.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
                mastered: progress.dueAt === null,
                successStreak: successful ? review.successStreak + 1 : 0,
                stabilityScore: Math.min(
                  100,
                  Math.max(
                    0,
                    review.stabilityScore +
                      (successful
                        ? confidence === "easy"
                          ? 30
                          : confidence === "hard"
                            ? 10
                            : 20
                        : -30),
                  ),
                ),
                reviewMode:
                  review.sourceType === "error_item"
                    ? ("repair" as const)
                    : (reviewModes[progress.stage] ?? "mixed"),
                ...(successful ? { lastSuccess: now.getTime() } : {}),
              }
            : review,
        );
        let nextErrors = current.errors;
        if (selected.sourceType === "error_item") {
          nextErrors = current.errors.map((error) => {
            if (error.id !== selected.sourceId) {
              return error;
            }
            const successfulRepairs = successful
              ? error.successfulRepairs + 1
              : 0;
            return {
              ...error,
              successfulRepairs,
              repairStatus: successful
                ? successfulRepairs >= 2
                  ? ("fixed" as const)
                  : ("improving" as const)
                : ("scheduled" as const),
              nextRepairAt:
                progress.dueAt?.getTime() ??
                now.getTime() + DAY_IN_MILLISECONDS,
            };
          });
        }

        const topicMastery =
          selected.sourceType === "grammar_topic"
            ? recordMasteryReview(current.mastery[selected.topic], successful)
            : current.mastery[selected.topic];
        return {
          ...current,
          reviews: nextReviews,
          errors: nextErrors,
          mastery: {
            ...current.mastery,
            [selected.topic]: setMasteryCriticalErrors(
              topicMastery,
              countActiveCriticalErrors(nextErrors, selected.topic),
            ),
          },
        };
      });
      if (
        selectedForShadow &&
        shadowProgress &&
        typeof window !== "undefined"
      ) {
        const nextSuccessStreak = successful
          ? selectedForShadow.successStreak + 1
          : 0;
        const nextStabilityScore = Math.min(
          100,
          Math.max(
            0,
            selectedForShadow.stabilityScore +
              (successful
                ? confidence === "easy"
                  ? 30
                  : confidence === "hard"
                    ? 10
                    : 20
                : -30),
          ),
        );
        recordFsrsShadowReview({
          storage: window.localStorage,
          event: {
            version: 1,
            eventId: shadowEventId,
            language: "de",
            reviewId: selectedForShadow.id,
            sourceId: selectedForShadow.sourceId,
            reviewedAt: reviewedAt.toISOString(),
            rating: fsrsShadowRatingFromResult(successful, confidence),
            legacyBefore: {
              dueAt: selectedForShadow.due,
              state: `stage-${selectedForShadow.stage}`,
              successStreak: selectedForShadow.successStreak,
              stabilityScore: selectedForShadow.stabilityScore,
              ...(selectedForShadow.lastSuccess !== undefined
                ? { lastSuccessAt: selectedForShadow.lastSuccess }
                : {}),
            },
            legacyAfter: {
              dueAt: shadowProgress.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
              state: `stage-${shadowProgress.stage}`,
              successStreak: nextSuccessStreak,
              stabilityScore: nextStabilityScore,
              ...(successful ? { lastSuccessAt: reviewedAt.getTime() } : {}),
            },
          },
        });
      }
    },
    [state.reviews],
  );

  const advanceReview = useCallback(
    (reviewId: string) => completeReview(reviewId, true),
    [completeReview],
  );

  const recordErrorRepair = useCallback(
    (errorId: string, successful: boolean) => {
      setState((current) => {
        const selected = current.errors.find((error) => error.id === errorId);
        if (!selected) {
          return current;
        }
        const successfulRepairs = successful
          ? selected.successfulRepairs + 1
          : 0;
        const nextErrors = current.errors.map((error) =>
          error.id === errorId
            ? {
                ...error,
                successfulRepairs,
                repairStatus: successful
                  ? successfulRepairs >= 2
                    ? ("fixed" as const)
                    : ("improving" as const)
                  : ("scheduled" as const),
                nextRepairAt: Date.now() + DAY_IN_MILLISECONDS,
              }
            : error,
        );
        return {
          ...current,
          errors: nextErrors,
          mastery: {
            ...current.mastery,
            [selected.topic]: setMasteryCriticalErrors(
              current.mastery[selected.topic],
              countActiveCriticalErrors(nextErrors, selected.topic),
            ),
          },
        };
      });
    },
    [],
  );

  const setMastery = useCallback((title: string, mastery: MasteryRecord) => {
    setState((current) => ({
      ...current,
      mastery: {
        ...current.mastery,
        [title]: mastery,
      },
    }));
  }, []);

  const importState = useCallback((value: unknown) => {
    setState(normalizeLearnerState(value));
  }, []);

  const resetState = useCallback(() => {
    setState(createInitialLearnerState());
  }, []);

  const value = useMemo<LearnerStateContextValue>(
    () => ({
      state,
      hydrated,
      updateSettings,
      updateLearnerProfile,
      updateOutcomeEvidence,
      setTodayGrammar,
      setDailyAnswer,
      completeDailyStep,
      markActivity,
      addError,
      addSession,
      recordAttempt,
      scheduleReview,
      advanceReview,
      completeReview,
      recordErrorRepair,
      setMastery,
      importState,
      resetState,
    }),
    [
      addError,
      addSession,
      advanceReview,
      completeReview,
      completeDailyStep,
      hydrated,
      importState,
      markActivity,
      recordAttempt,
      recordErrorRepair,
      resetState,
      scheduleReview,
      setDailyAnswer,
      setMastery,
      setTodayGrammar,
      state,
      updateSettings,
      updateLearnerProfile,
      updateOutcomeEvidence,
    ],
  );

  return (
    <LearnerStateContext.Provider value={value}>
      {children}
    </LearnerStateContext.Provider>
  );
}

export function useLearnerState(): LearnerStateContextValue {
  const value = useContext(LearnerStateContext);
  if (!value) {
    throw new Error(
      "useLearnerState must be used inside LearnerStateProvider.",
    );
  }
  return value;
}
