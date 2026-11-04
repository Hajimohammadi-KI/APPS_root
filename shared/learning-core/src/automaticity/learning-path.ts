import type { Language } from "./contracts";
import type { CurriculumPack } from "./curriculum";
import { reduceAutomaticityEvents } from "./evidence";
import { selectNextLearningTask } from "./selector";
import { readAutomaticityEvents, type LocalStore } from "./storage";

export interface LearningPathRequest {
  level?: string;
  topic?: string;
  constructionId?: string;
  taskId?: string;
}

// Baseline facade reproduces the current practice entry before compatibility fixes.
export function resolveLearningPath(pack: CurriculumPack, store: LocalStore, at: string, request: LearningPathRequest = {}) {
  const level = request.level ?? store.getItem(`automaticity:v2:${pack.language}:level`) ?? "A1";
  const next = selectNextLearningTask(pack, reduceAutomaticityEvents(readAutomaticityEvents(store, pack.language).events, pack.language, at), at, level, undefined, "checked");
  return next?.task ? { ...next, task: next.task, level: next.unit.level, source: "recommendation", href: `/practice?task=${encodeURIComponent(next.task.id)}&level=${next.unit.level}` } : null;
}

export function saveLearningPathChoice(store: LocalStore, language: Language, choice: Omit<LearningPathRequest, "taskId">, at: string) {
  store.setItem(`automaticity:v2:${language}:choice`, JSON.stringify({ version: 1, ...choice, updatedAt: at }));
}
