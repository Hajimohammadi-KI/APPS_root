import type { Language } from "./contracts";
import type { CurriculumPack } from "./curriculum";
import {
  resolveLearningPath,
  type LearningPathRequest,
  type LearningPathSelection,
} from "./learning-path";
import { loadCurriculumPack } from "./overview";
import { loadSchedulerPilot, type LoadedPilot } from "./scheduler-pilot-panel";
import {
  outsidePilotPack,
  readPilotEnrollment,
  schedulerPilotCards,
} from "./scheduler-pilot";
import { readAutomaticityEvents } from "./storage";

function launchRequest(): LearningPathRequest {
  const params = new URLSearchParams(location.search);
  const request: LearningPathRequest = {};
  for (const key of ["level", "topic", "constructionId"] as const) {
    const value = params.get(key);
    if (value) request[key] = value;
  }
  const task = params.get("task");
  if (task) request.taskId = task;
  return request;
}

/** Subscribe without writing preferences or importing legacy learning records. */
export function watchLearningPath(
  language: Language,
  update: (value: LearningPathSelection | null) => void,
  request?: () => LearningPathRequest,
): () => void {
  let active = true;
  let pack: CurriculumPack | null = null;
  let loading = false;
  let pilot: LoadedPilot | null = null;
  let ignoreLaunch = false;
  const refresh = async () => {
    if (loading || !active) return;
    let result: LearningPathSelection | null = null;
    try {
      if (!pack) {
        loading = true;
        pack = await loadCurriculumPack(language);
        pilot = await loadSchedulerPilot(pack, localStorage);
      }
      const at = new Date().toISOString();
      const policyPack = pilot
        ? outsidePilotPack(
            pack,
            schedulerPilotCards(
              pilot.plan,
              readPilotEnrollment(localStorage, pilot.plan, pilot.sha256),
              readAutomaticityEvents(localStorage, language).events,
              at,
            ),
          )
        : pack;
      result = resolveLearningPath(
        pack,
        localStorage,
        at,
        request ? request() : ignoreLaunch ? {} : launchRequest(),
        policyPack,
      );
    } catch {
      // No default topic is substituted for unavailable saved data/catalog.
    } finally {
      loading = false;
    }
    if (active) update(result);
  };
  const changed = () => {
    void refresh();
  };
  const choiceChanged = () => {
    ignoreLaunch = true;
    changed();
  };
  const events = [
    "storage",
    "focus",
    "pageshow",
    "automaticity-history-updated",
    "language-topic-changed",
  ];
  for (const event of events) window.addEventListener(event, changed);
  window.addEventListener("automaticity-choice-updated", choiceChanged);
  void refresh();
  return () => {
    active = false;
    for (const event of events) window.removeEventListener(event, changed);
    window.removeEventListener("automaticity-choice-updated", choiceChanged);
  };
}

/** The primary recommendation sits above the separately labelled extra activities. */
export function mountDailyLearningPath(
  root: HTMLElement,
  language: Language,
): () => void {
  const t = (en: string, de: string) => (language === "en" ? en : de);
  root.setAttribute("aria-label", t("Main learning path", "Hauptlernweg"));
  root.style.cssText =
    "display:grid;gap:8px;margin:16px 0;padding:18px 20px;border:1px solid #cbbde6;border-radius:18px;background:#fff;color:#251b38;line-height:1.55;overflow-wrap:anywhere";
  const heading = document.createElement("h2");
  heading.textContent = t("Your next step", "Dein nächster Schritt");
  heading.style.margin = "0";
  const focus = document.createElement("p");
  focus.dataset.learningPathFocus = "";
  const explanation = document.createElement("p");
  explanation.textContent = t(
    "This is the same main path as Home and Continue. The activities below and the error notebook are extra practice.",
    "Das ist derselbe Hauptlernweg wie auf Start und unter Fortsetzen. Die Aktivitäten unten und das Fehlerheft sind zusätzliche Übungen.",
  );
  const link = document.createElement("a");
  link.textContent = t(
    "Continue main learning path",
    "Hauptlernweg fortsetzen",
  );
  link.dataset.learningPathPrimary = "";
  link.style.cssText =
    "justify-self:start;display:inline-flex;min-height:44px;align-items:center;padding:8px 16px;border-radius:12px;background:#6637a6;color:#fff;font-weight:700;text-decoration:none";
  link.href = "/practice";
  root.replaceChildren(heading, focus, explanation, link);
  const stop = watchLearningPath(language, (selection) => {
    focus.textContent = selection
      ? `${selection.unit.title} · ${selection.level}`
      : t(
          "The next step is temporarily unavailable. Open practice to check your saved work.",
          "Der nächste Schritt ist vorübergehend nicht verfügbar. Öffne die Übung, um deine gespeicherten Antworten zu prüfen.",
        );
    for (const anchor of document.querySelectorAll<HTMLAnchorElement>(
      "[data-learning-path-primary]",
    ))
      anchor.href = selection?.href ?? "/practice";
    for (const node of document.querySelectorAll<HTMLElement>(
      "[data-learning-path-topic]",
    ))
      node.textContent = focus.textContent;
    if (selection) {
      const notebook = document.querySelector<HTMLElement>(
        "[data-notebook-daily]",
      );
      if (notebook) notebook.dataset.level = selection.level;
    }
  });
  return () => {
    stop();
    root.replaceChildren();
  };
}
