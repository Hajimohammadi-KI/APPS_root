import type { Language } from "./contracts";
import type { CurriculumPack } from "./curriculum";
import { reduceAutomaticityEvents } from "./evidence";
import {
  DAILY_NOTEBOOK_GOAL,
  notebookCopy,
  notebookProgress,
} from "./notebook-practice";
import { loadCurriculumPack } from "./overview";
import { readAutomaticityEvents } from "./storage";

/** The daily plan's part of the error notebook: the items of the
 * grammar level the daily page shows (its `data-level`), today's count and a
 * link to the next item in the learning path. */
export function mountDailyNotebook(
  root: HTMLElement,
  language: Language,
): () => void {
  const t = (en: string, de: string) => (language === "en" ? en : de);
  let pack: CurriculumPack | null = null;
  const node = <K extends keyof HTMLElementTagNameMap>(
    tag: K,
    text: string,
  ) => {
    const value = document.createElement(tag);
    value.textContent = text;
    return value;
  };
  const link = (text: string, href: string) => {
    const value = node("a", text);
    value.href = href;
    value.style.cssText =
      "justify-self:start;display:inline-flex;min-height:40px;align-items:center;padding:8px 16px;border-radius:12px;background:#007f83;color:#fff;font-weight:700;text-decoration:none";
    return value;
  };
  root.style.cssText =
    "display:grid;gap:8px;margin:16px 0;padding:18px 20px;border:1px solid #eddfb8;border-left:4px solid #d6b54d;border-radius:18px;background:#fff5d7;color:#08364a;line-height:1.55;overflow-wrap:anywhere";
  const render = () => {
    if (!pack) return;
    const level = root.dataset.level || "A1";
    const now = new Date().toISOString();
    const reduced = reduceAutomaticityEvents(
      readAutomaticityEvents(localStorage, language).events,
      language,
      now,
    );
    const progress = notebookProgress(pack, reduced.attempts, { level, now });
    const copy = notebookCopy(language);
    const heading = node("h3", `${copy.todayTitle} · ${level}`);
    heading.style.margin = "0";
    root.hidden = false;
    if (!progress.total) {
      root.replaceChildren(
        heading,
        node("p", copy.noneAt(level)),
        link(
          t("Practise another level", "Ein anderes Niveau üben"),
          "/practice?notebook=1",
        ),
      );
      return;
    }
    root.replaceChildren(
      heading,
      node(
        "p",
        `${t(`Today: ${progress.today} of ${DAILY_NOTEBOOK_GOAL} exercises`, `Heute: ${progress.today} von ${DAILY_NOTEBOOK_GOAL} Übungen`)} · ${t(`${progress.passed} of ${progress.total} passed at ${level}`, `${progress.passed} von ${progress.total} auf ${level} bestanden`)}. ${copy.source}`,
      ),
      progress.next
        ? link(
            progress.today >= DAILY_NOTEBOOK_GOAL
              ? t(
                  "Daily goal reached · practise one more",
                  "Tagesziel erreicht · noch eine üben",
                )
              : t("Practise the next exercise", "Nächste Übung machen"),
            `/practice?notebook=1&level=${encodeURIComponent(level)}`,
          )
        : node(
            "p",
            t(
              `All ${level} exercises passed. They return with the learning path's reviews.`,
              `Alle Übungen auf ${level} bestanden. Sie kommen mit den Wiederholungen des Lernwegs wieder.`,
            ),
          ),
    );
  };
  const changed = () => {
    try {
      render();
    } catch {
      root.hidden = true;
    }
  };
  // The daily page sets data-level when the learner picks another level.
  const observer = new MutationObserver(changed);
  observer.observe(root, { attributes: true, attributeFilter: ["data-level"] });
  window.addEventListener("storage", changed);
  window.addEventListener("focus", changed);
  window.addEventListener("pageshow", changed);
  void loadCurriculumPack(language)
    .then((value) => {
      pack = value;
      changed();
    })
    .catch(() => {
      root.hidden = true;
    });
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", changed);
    window.removeEventListener("focus", changed);
    window.removeEventListener("pageshow", changed);
    root.replaceChildren();
  };
}
