import {
  filterDailyPlanEligibleMediationContent,
  type MediationContentPilotItem,
} from "@automaticity/learning-core";

/**
 * Entwurf für den B1-Mediationspiloten. Vor zwei unabhängigen menschlichen
 * Prüfungen darf kein Eintrag in den Tagesplan gelangen.
 */
export const germanMediationB1Pilot = [
  {
    schemaVersion: "1.0.0",
    id: "de:authored:b1:mediation:bibliothek-kursaenderung",
    version: "1.0.0-draft.1",
    language: "de",
    cefrLevel: "B1",
    title: "Eine Kursänderung weitergeben",
    targetForm:
      "Wesentliche Informationen auswählen und mit eigenen Worten weitergeben",
    prompt:
      "Erkläre einer Kursteilnehmerin, die den Aushang nicht gelesen hat, die Änderung und die nötige Vorbereitung.",
    modes: ["mediation", "speaking", "writing", "transfer"],
    provenance: {
      kind: "authored",
      sourceId: "automaticity-b1-mediation-pilot-de",
      license: "proprietary-authored",
      humanReviewed: false,
    },
    mediation: {
      activity: "relaying-specific-information",
      sourceText:
        "Der Computerkurs am Donnerstag beginnt wegen einer Teamsitzung erst um 18:30 Uhr statt um 17:00 Uhr. Bitte bringen Sie eigene Kopfhörer mit. Ihre Anmeldung bleibt gültig.",
      guidedPrompt:
        "Markiere zuerst die neue Uhrzeit, den Grund, die nötige Vorbereitung und die Information, die unverändert bleibt.",
      independentPrompt:
        "Gib den Inhalt danach natürlich in zwei bis drei eigenen Sätzen weiter.",
      novelTransferPrompt:
        "Ein Nachbar hat eine Mitteilung der Hausverwaltung verpasst. Bitte um einen neuen kurzen Text und erkläre ihm nur die Änderungen, die ihn betreffen.",
    },
    quality: {
      rubricVersion: "1.0.0",
      status: "awaiting-human-review",
      reviews: [],
    },
  },
] as const satisfies readonly MediationContentPilotItem[];

/** Bleibt leer, bis die menschliche Qualitätsprüfung bestanden ist. */
export const releasedGermanMediationB1 =
  filterDailyPlanEligibleMediationContent(germanMediationB1Pilot);
