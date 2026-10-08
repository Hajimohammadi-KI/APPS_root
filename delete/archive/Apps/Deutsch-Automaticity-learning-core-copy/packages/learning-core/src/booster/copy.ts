import type { BoosterCopy } from "./types";

export const BOOSTER_COPY: Readonly<Record<"en" | "de", BoosterCopy>> = {
  en: {
    direction: "ltr",
    eyebrow: "Optional forced-output booster",
    title: "Use one structure repeatedly under gentle time pressure",
    purpose:
      "Three to five short rounds use time already assigned to automatization. One session never proves mastery or automaticity.",
    round: "Round",
    of: "of",
    seconds: "seconds",
    speak: "Record a real answer",
    typeInstead: "Type instead",
    startRecording: "Start recording",
    stopRecording: "Stop and review",
    recordingReady:
      "Real audio captured. Add or correct the transcript, then save this round.",
    microphoneUnavailable:
      "Microphone recording is unavailable. The explicit typing fallback is ready.",
    responseLabel: "Your response or corrected transcript",
    responsePlaceholder:
      "Produce a complete response using the target structure…",
    submit: "Save this practice round",
    next: "Next round",
    finish: "Finish booster",
    saved: "Practice evidence saved locally.",
    notSaved: "The attempt could not be saved locally.",
    noEvidence:
      "No evidence was created. Empty or abandoned work never counts.",
    practiceOnly:
      "Practice feedback only — not mastery, a level change, or proof of automaticity.",
    metrics: {
      structure: "Checked structure uses",
      productions: "Complete productions",
      latency: "Speech/typing onset",
      wordsPerMinute: "Practice pace",
    },
    prompts: {
      "picture-description":
        "Describe a person working at a desk. Use {target} in at least one complete sentence.",
      "situation-reaction":
        "React to this situation: a plan changed at the last minute. Use {target} naturally.",
      continuation:
        "Continue this idea with two connected sentences: Today was different because… Use {target}.",
      transformation:
        "Transform this meaning into your own complete sentence with {target}: the action connects past and present.",
      "mini-argument":
        "Give a short opinion and one reason about remote learning. Use {target} at least twice.",
    },
  },
  de: {
    direction: "ltr",
    eyebrow: "Optionaler Forced-Output-Booster",
    title: "Eine Struktur unter sanftem Zeitdruck wiederholt verwenden",
    purpose:
      "Drei bis fünf kurze Runden nutzen nur die bereits für Automatisierung eingeplante Zeit. Eine Einheit beweist niemals Beherrschung oder Automatik.",
    round: "Runde",
    of: "von",
    seconds: "Sekunden",
    speak: "Echte Antwort aufnehmen",
    typeInstead: "Stattdessen tippen",
    startRecording: "Aufnahme starten",
    stopRecording: "Stoppen und prüfen",
    recordingReady:
      "Echte Aufnahme erfasst. Ergänze oder korrigiere das Transkript und speichere dann die Runde.",
    microphoneUnavailable:
      "Die Mikrofonaufnahme ist nicht verfügbar. Der ausdrückliche Tipp-Fallback ist bereit.",
    responseLabel: "Deine Antwort oder dein korrigiertes Transkript",
    responsePlaceholder:
      "Formuliere eine vollständige Antwort mit der Zielstruktur…",
    submit: "Diese Übungsrunde speichern",
    next: "Nächste Runde",
    finish: "Booster beenden",
    saved: "Der Übungsnachweis wurde lokal gespeichert.",
    notSaved: "Der Versuch konnte nicht lokal gespeichert werden.",
    noEvidence:
      "Es wurde kein Nachweis erstellt. Leere oder abgebrochene Arbeit zählt nie.",
    practiceOnly:
      "Nur Übungsfeedback — keine Beherrschung, keine Niveauänderung und kein Beweis für Automatik.",
    metrics: {
      structure: "Geprüfte Strukturverwendungen",
      productions: "Vollständige Äußerungen",
      latency: "Sprech-/Schreibbeginn",
      wordsPerMinute: "Übungstempo",
    },
    prompts: {
      "picture-description":
        "Beschreibe eine Person bei der Arbeit am Schreibtisch. Verwende {target} in mindestens einem vollständigen Satz.",
      "situation-reaction":
        "Reagiere auf diese Situation: Ein Plan wurde kurzfristig geändert. Verwende {target} natürlich.",
      continuation:
        "Führe die Idee mit zwei verbundenen Sätzen fort: Heute war alles anders, weil… Verwende {target}.",
      transformation:
        "Formuliere diese Bedeutung als eigenen vollständigen Satz mit {target}: Eine Handlung verbindet Vergangenheit und Gegenwart.",
      "mini-argument":
        "Gib eine kurze Meinung und einen Grund zum Online-Lernen. Verwende {target} mindestens zweimal.",
    },
  },
} as const;
