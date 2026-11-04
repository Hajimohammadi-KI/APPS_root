import { mountDailyNotebook } from "./daily-notebook";
import { mountEvidenceOverview } from "./overview";
import { mountDailyLearningPath } from "./learning-path-browser";
const language = document.documentElement.lang === "de" ? "de" : "en";
const root = document.querySelector<HTMLElement>(
  "[data-automaticity-overview]",
);
if (root) mountEvidenceOverview(root, language);
const notebook = document.querySelector<HTMLElement>("[data-notebook-daily]");
if (notebook) mountDailyNotebook(notebook, language);
const path = document.querySelector<HTMLElement>("[data-learning-path-daily]");
if (path) mountDailyLearningPath(path, language);
