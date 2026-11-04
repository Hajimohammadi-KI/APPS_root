import { isRecord, type Language } from "./contracts";
import {
  activePracticeTasks,
  type CurriculumPack,
  type PracticeTask,
  type ConstructionUnit,
} from "./curriculum";
import { reduceAutomaticityEvents } from "./evidence";
import {
  isCheckedTask,
  selectDailyTask,
  selectNextLearningTask,
  type TaskRecommendation,
} from "./selector";
import {
  hasUnfinishedPractice,
  parseSavedPracticeSession,
} from "./practice-session";
import { readAutomaticityEvents, sessionKey, type LocalStore } from "./storage";

export interface LearningPathRequest {
  level?: string;
  topic?: string;
  constructionId?: string;
  taskId?: string;
}

interface Choice {
  version: 1;
  level: string;
  constructionId?: string;
  topic?: string;
  updatedAt: string;
}
export interface LearningPathSelection extends TaskRecommendation {
  unit: ConstructionUnit;
  task: PracticeTask;
  level: string;
  source:
    "requested" | "draft" | "saved_choice" | "continued" | "recommendation";
  href: string;
}
const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
const choiceKey = (language: Language) => `automaticity:v2:${language}:choice`;
const validLevel = (level: unknown): level is string =>
  typeof level === "string" && levels.includes(level);
function json(store: LocalStore, key: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(store.getItem(key) ?? "null");
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}
function choice(
  value: Record<string, unknown> | null,
  language: Language,
): Choice | null {
  if (
    !value ||
    value.version !== 1 ||
    !validLevel(value.level) ||
    typeof value.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    (value.constructionId !== undefined &&
      (typeof value.constructionId !== "string" ||
        !value.constructionId.startsWith(language + "."))) ||
    (value.topic !== undefined &&
      (typeof value.topic !== "string" || !value.topic.trim()))
  )
    return null;
  return value as unknown as Choice;
}
function legacyStates(store: LocalStore, language: Language) {
  return (
    language === "en"
      ? ["grammar-automaticity:v27", "GrammarAutomaticityV11_en"]
      : [
          "GrammarAutomaticityV11_de",
          "german-automaticity:v20",
          "grammar-automaticity:de",
        ]
  )
    .map((key) => json(store, key))
    .filter((value): value is Record<string, unknown> => value !== null);
}
function savedChoice(
  store: LocalStore,
  language: Language,
  states: Record<string, unknown>[],
  pack: CurriculumPack,
): Choice | null {
  const available = (intent: Choice) =>
    pack.units.some((unit) => unit.level === intent.level) &&
    (!(intent.topic || intent.constructionId) || !!unitFor(pack, intent));
  const storedCanonical = choice(json(store, choiceKey(language)), language);
  const canonical =
    storedCanonical && available(storedCanonical) ? storedCanonical : null;
  const direct = json(
    store,
    `${language === "en" ? "english" : "deutsch"}-automaticity:today-grammar`,
  );
  const candidates = [
    direct,
    ...states.map((state) =>
      isRecord(state.todayGrammar) ? state.todayGrammar : null,
    ),
  ]
    .flatMap((row) => {
      if (!row || !validLevel(row.level)) return [];
      const topic = typeof row.topic === "string" ? row.topic : row.title;
      if (typeof topic !== "string" || !topic.trim()) return [];
      const stamp =
        typeof row.updatedAt === "string"
          ? row.updatedAt
          : typeof row.date === "string"
            ? row.date
            : "1970-01-01T00:00:00Z";
      return Number.isFinite(Date.parse(stamp))
        ? [{ version: 1 as const, level: row.level, topic, updatedAt: stamp }]
        : [];
    })
    .filter(available)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const legacy = candidates[0];
  return canonical &&
    (!legacy || Date.parse(canonical.updatedAt) >= Date.parse(legacy.updatedAt))
    ? canonical
    : (legacy ?? null);
}
function unitFor(pack: CurriculumPack, intent: LearningPathRequest) {
  return pack.units.find(
    (unit) =>
      unit.language === pack.language &&
      (!intent.level || unit.level === intent.level) &&
      (intent.constructionId
        ? unit.id === intent.constructionId
        : intent.topic
          ? unit.title === intent.topic || unit.lessonAlias === intent.topic
          : false),
  );
}
function selected(
  unit: ConstructionUnit,
  task: PracticeTask,
  source: LearningPathSelection["source"],
  reason: TaskRecommendation["reason"],
  previousAttemptId: string | null,
): LearningPathSelection {
  const query = new URLSearchParams({
    task: task.id,
    level: unit.level,
    from: "learning-path",
  });
  if (previousAttemptId) query.set("repairOf", previousAttemptId);
  return {
    unit,
    task,
    level: unit.level,
    source,
    reason,
    previousAttemptId,
    href: `/practice?${query}`,
  };
}

/** Read-only intent resolution shared by every primary entry. Automatic suggestions
 * never become an explicit preference, and unreadable legacy bytes stay intact. */
export function resolveLearningPath(
  pack: CurriculumPack,
  store: LocalStore,
  at: string,
  request: LearningPathRequest = {},
  policyPack: CurriculumPack = pack,
): LearningPathSelection | null {
  const states = legacyStates(store, pack.language);
  const saved = savedChoice(store, pack.language, states, pack);
  const validPackLevel = (level: unknown): level is string =>
    validLevel(level) && pack.units.some((unit) => unit.level === level);
  const requestedLevel = validPackLevel(request.level)
    ? request.level
    : undefined;
  const learnerLevels = states.flatMap((state) => [
    state.learningLevel,
    isRecord(state.learner) ? state.learner.selfDeclaredLevel : null,
  ]);
  const level =
    [
      requestedLevel,
      saved?.level,
      store.getItem(`automaticity:v2:${pack.language}:level`),
      ...states.map((state) => state.learningLevel),
      store.getItem(
        pack.language === "en" ? "english-cefr-level" : "german-cefr-level",
      ),
      ...learnerLevels,
      "A1",
    ].find(validPackLevel) ??
    pack.units[0]?.level ??
    "A1";
  const state = reduceAutomaticityEvents(
    readAutomaticityEvents(store, pack.language).events,
    pack.language,
    at,
  );
  const requestedTaskUnit = request.taskId
    ? pack.units.find(
        (unit) =>
          unit.language === pack.language &&
          (!requestedLevel || unit.level === requestedLevel) &&
          unit.tasks.some((task) => task.id === request.taskId),
      )
    : undefined;
  const requestedTask = requestedTaskUnit?.tasks.find(
    (task) => task.id === request.taskId,
  );
  if (requestedTaskUnit && requestedTask)
    return selected(
      requestedTaskUnit,
      requestedTask,
      "requested",
      "continued_practice",
      null,
    );
  const requestedIntent = { ...request };
  if (requestedLevel) requestedIntent.level = requestedLevel;
  else delete requestedIntent.level;
  const requestedUnit = unitFor(pack, requestedIntent);
  if (requestedUnit) {
    const next = selectDailyTask(requestedUnit, state, at, "checked");
    if (next.task)
      return selected(
        requestedUnit,
        next.task,
        "requested",
        next.reason,
        next.previousAttemptId,
      );
  }
  let session = null;
  try {
    session = parseSavedPracticeSession(
      store.getItem(sessionKey(pack.language)),
    );
  } catch {
    /* Preserve unreadable session; practice offers recovery. */
  }
  const draftUnit = session
    ? pack.units.find((unit) =>
        activePracticeTasks(unit).some(
          (task) =>
            task.id === session!.taskId &&
            task.version === session!.taskVersion,
        ),
      )
    : undefined;
  const draftTask =
    draftUnit && session
      ? activePracticeTasks(draftUnit).find(
          (task) =>
            task.id === session!.taskId &&
            task.version === session!.taskVersion,
        )
      : undefined;
  const savedUnit =
    saved && (!requestedLevel || saved.level === requestedLevel)
      ? unitFor(pack, saved)
      : undefined;
  const newerIntent = !!(
    saved &&
    session &&
    Date.parse(saved.updatedAt) > Date.parse(session.startedAt) &&
    (saved.level !== draftUnit?.level ||
      (savedUnit && savedUnit.id !== draftUnit?.id))
  );
  if (
    session &&
    draftUnit &&
    draftTask &&
    isCheckedTask(draftTask) &&
    draftTask.partition === "practice" &&
    hasUnfinishedPractice(session) &&
    (!requestedLevel || requestedLevel === draftUnit.level) &&
    !newerIntent
  )
    return selected(
      draftUnit,
      draftTask,
      "draft",
      "continued_practice",
      session.previousAttemptId,
    );
  if (savedUnit) {
    const next = selectDailyTask(savedUnit, state, at, "checked");
    if (next.task)
      return selected(
        savedUnit,
        next.task,
        "saved_choice",
        next.reason,
        next.previousAttemptId,
      );
  }
  const preferred = draftUnit?.level === level ? draftUnit.id : undefined;
  const next = selectNextLearningTask(
    policyPack,
    state,
    at,
    level,
    preferred,
    "checked",
  );
  return next?.task
    ? selected(
        next.unit,
        next.task,
        saved ? "saved_choice" : preferred ? "continued" : "recommendation",
        next.reason,
        next.previousAttemptId,
      )
    : null;
}

/** Only explicit learner actions call this writer; other stores are untouched. */
export function saveLearningPathChoice(
  store: LocalStore,
  language: Language,
  intent: Omit<LearningPathRequest, "taskId"> & { level: string },
  at: string,
): void {
  const previous = store.getItem(choiceKey(language));
  if (previous !== null && !choice(json(store, choiceKey(language)), language))
    throw new Error("Unreadable saved learning choice; original data kept");
  const value = choice({ version: 1, ...intent, updatedAt: at }, language);
  if (!value) throw new Error("Invalid learning choice");
  const bytes = JSON.stringify(value);
  store.setItem(choiceKey(language), bytes);
  if (store.getItem(choiceKey(language)) !== bytes)
    throw new Error("Learning choice was not saved");
}
