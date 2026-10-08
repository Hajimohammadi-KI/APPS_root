import { mountEvidenceOverview } from "./overview";
const root = document.querySelector<HTMLElement>(
  "[data-automaticity-overview]",
);
if (root)
  mountEvidenceOverview(
    root,
    document.documentElement.lang === "de" ? "de" : "en",
  );
