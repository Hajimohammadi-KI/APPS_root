import { mountDailyNotebook } from "./daily-notebook";
import { mountEvidenceOverview } from "./overview";
const language = document.documentElement.lang === "de" ? "de" : "en";
const root = document.querySelector<HTMLElement>(
  "[data-automaticity-overview]",
);
if (root) mountEvidenceOverview(root, language);
const notebook = document.querySelector<HTMLElement>("[data-notebook-daily]");
if (notebook) mountDailyNotebook(notebook, language);
