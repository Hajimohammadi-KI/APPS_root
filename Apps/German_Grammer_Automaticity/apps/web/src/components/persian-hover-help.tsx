"use client";

import * as React from "react";

const TOOLTIP_ID = "deutschflow-persian-help";

const exactHelp: Record<string, string> = {
  Startseite: "Öffnet die Lernübersicht und den nächsten empfohlenen Schritt.",
  "Heute lernen": "Öffnet die heutigen Übungen in der geplanten Reihenfolge.",
  Gesprächsstudio: "Dient für freies Sprechen, Aufnahme und direkte Korrektur.",
  Grammatiklabor: "Öffnet alle Grammatikthemen mit Erklärungen und Übungen.",
  Sprechthemen: "Zeigt Gesprächsthemen nach Niveau und Situation.",
  Wiederholungen: "Zeigt Aufgaben, die heute erneut geübt werden sollen.",
  Lernressourcen: "Öffnet ergänzende Lernmaterialien und externe Quellen.",
  Fehlerwerkstatt: "Zeigt gespeicherte Fehler und den Reparaturpfad je Fehler.",
  Audiothek: "Spielt gespeicherte Aufnahmen ab und verwaltet sie.",
  Einstellungen: "Öffnet Lern-, Barrierefreiheits-, Datenschutz- und Backup-Einstellungen.",
  Hilfe: "Öffnet eine kurze Anleitung zur Nutzung der App.",
  Vorlesen: "Liest den Seitentext mit der Systemstimme vor.",
  Installieren: "Öffnet die Installationshilfe für dieses Gerät.",
  Speichern: "Speichert die aktuellen Änderungen auf diesem Gerät.",
  Abbrechen: "Schließt das Fenster ohne neue Änderungen zu speichern.",
  Zurück: "Geht zum vorherigen Schritt oder zur vorherigen Seite.",
  Weiter: "Geht zum nächsten Schritt oder zur nächsten Seite.",
  Starten: "Startet die ausgewählte Übung oder Aktivität.",
  Prüfen: "Prüft deine Antwort anhand des Übungsziels.",
  Wiederholen: "Wiederholt den Inhalt zur Festigung.",
  Löschen: "Entfernt den ausgewählten Eintrag nach Bestätigung.",
};

const partialHelp: ReadonlyArray<readonly [string, string]> = [
  ["niveau", "Verwaltet das gewählte Niveau und die Nachweise für den Fortschritt."],
  ["sprechen", "Öffnet oder erfasst Sprechübungen und Nachweise."],
  ["schreiben", "Öffnet oder erfasst Schreibübungen und Nachweise."],
  ["grammatik", "Zeigt grammatikbezogene Inhalte oder Übungen."],
  ["audio", "Spielt zugehörige Aufnahmen ab, speichert oder verwaltet sie."],
  ["fehler", "Zeigt Fehler und den jeweiligen Reparaturpfad."],
  ["fortschritt", "Zeigt den erfassten Fortschritt und den nächsten Schritt."],
  ["suchen", "Sucht innerhalb des aktuellen Bereichs."],
  ["filtern", "Begrenzt die aktuell angezeigten Einträge."],
  ["öffnen", "Öffnet den ausgewählten Bereich oder Eintrag."],
];

type HelpKind =
  | "button"
  | "link"
  | "input"
  | "checkbox"
  | "label"
  | "heading"
  | "text"
  | "box";

const candidateSelector = [
  "[data-persian-help]",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  "legend",
  "summary",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "li",
  "th",
  "td",
  '[role="button"]',
  '[role="menuitem"]',
  '[data-slot="card"]',
  '[data-slot="field"]',
  '[data-slot="empty"]',
  '[data-slot="accordion-item"]',
  ".learning-accordion",
  ".metric-card",
  "section[aria-label]",
  "article[aria-label]",
].join(",");

const interactiveSelector = [
  "[data-persian-help]",
  "button",
  "a[href]",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  '[role="button"]',
  '[role="menuitem"]',
].join(",");

function kindOf(element: HTMLElement): HelpKind {
  if (
    element instanceof HTMLButtonElement ||
    element.getAttribute("role") === "button"
  ) {
    return "button";
  }
  if (element instanceof HTMLAnchorElement) return "link";
  if (element instanceof HTMLInputElement) {
    return element.type === "checkbox" || element.type === "radio"
      ? "checkbox"
      : "input";
  }
  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return "input";
  }
  if (element.matches("label, legend")) return "label";
  if (element.matches("h1, h2, h3, h4")) return "heading";
  if (
    element.matches(
      '[data-slot="card"], [data-slot="field"], [data-slot="empty"], [data-slot="accordion-item"], .learning-accordion, .metric-card, section[aria-label], article[aria-label]',
    )
  ) {
    return "box";
  }
  return "text";
}

function labelOf(element: HTMLElement, kind: HelpKind) {
  const formLabel =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
      ? [...(element.labels ?? [])]
          .map((label) => label.textContent ?? "")
          .join(" ")
      : "";
  const boxHeading =
    kind === "box"
      ? (element
          .querySelector<HTMLElement>("h1, h2, h3, h4, legend")
          ?.textContent?.trim() ?? "")
      : "";

  return (
    element.getAttribute("aria-label")?.trim() ||
    formLabel.trim() ||
    boxHeading ||
    element.textContent?.replace(/\s+/g, " ").trim() ||
    element.getAttribute("placeholder")?.trim() ||
    element.dataset.originalHoverTitle?.trim() ||
    ""
  );
}

function helpFor(label: string, kind: HelpKind) {
  const normalized = label.replace(/\s+/g, " ").trim();
  const excerpt = normalized.slice(0, 105);
  const exact = Object.entries(exactHelp).find(([key]) =>
    normalized.toLocaleLowerCase("de").startsWith(key.toLocaleLowerCase("de")),
  );
  if (exact) return exact[1];
  const partial = partialHelp.find(([key]) =>
    normalized.toLocaleLowerCase("de").includes(key),
  );
  if (partial) return partial[1];

  if (kind === "button") {
    return excerpt
      ? `Diese Schaltfläche führt die Aktion „${excerpt}“ aus.`
      : "Diese Schaltfläche führt die zugehörige Aktion aus.";
  }
  if (kind === "link") {
    return excerpt
      ? `Dieser Link öffnet den Bereich oder die Quelle „${excerpt}“.`
      : "Dieser Link öffnet den zugehörigen Bereich.";
  }
  if (kind === "input") {
    return excerpt
      ? `Hier gibst du Informationen zu „${excerpt}“ ein oder wählst sie aus.`
      : "Hier gibst du die zugehörigen Informationen ein oder wählst sie aus.";
  }
  if (kind === "checkbox") {
    return excerpt
      ? `Aktiviert oder deaktiviert die Option „${excerpt}“.`
      : "Aktiviert oder deaktiviert diese Option.";
  }
  if (kind === "label") {
    return excerpt
      ? `Dieses Label beschreibt das Feld „${excerpt}“.`
      : "Dieses Label beschreibt das zugehörige Feld.";
  }
  if (kind === "heading") {
    return excerpt
      ? `Diese Überschrift führt in den Bereich „${excerpt}“ ein.`
      : "Diese Überschrift führt in den darunterliegenden Bereich ein.";
  }
  if (kind === "box") {
    return excerpt
      ? `Dieses Feld bündelt Informationen und Optionen zu „${excerpt}“.`
      : "Dieses Feld bündelt zusammengehörige Informationen.";
  }
  return excerpt
    ? `Dieser Text erklärt „${excerpt}“.`
    : "Dieser Text erklärt den aktuellen Bereich.";
}

function prepare(root: ParentNode) {
  const elements =
    root instanceof HTMLElement && root.matches(candidateSelector)
      ? [root, ...root.querySelectorAll<HTMLElement>(candidateSelector)]
      : [...root.querySelectorAll<HTMLElement>(candidateSelector)];

  for (const element of elements) {
    if (!element.dataset.originalHoverTitle && element.title) {
      element.dataset.originalHoverTitle = element.title;
      element.removeAttribute("title");
    }
    const kind = kindOf(element);
    element.dataset.persianTooltip =
      element.dataset.persianHelp ?? helpFor(labelOf(element, kind), kind);
  }
}

function targetElement(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  const element =
    target.closest(interactiveSelector) ?? target.closest(candidateSelector);
  if (!(element instanceof HTMLElement) || element.closest(`#${TOOLTIP_ID}`)) {
    return null;
  }
  return element;
}

export function PersianHoverHelp() {
  const [tooltip, setTooltip] = React.useState<{
    text: string;
    left: number;
    top: number;
    above: boolean;
  } | null>(null);

  React.useEffect(() => {
    prepare(document);
    const show = (element: HTMLElement) => {
      prepare(element);
      const text = element.dataset.persianTooltip;
      if (!text) return;
      const rect = element.getBoundingClientRect();
      setTooltip({
        text,
        left: Math.min(
          Math.max(rect.left + rect.width / 2, 176),
          Math.max(176, window.innerWidth - 176),
        ),
        top:
          rect.bottom > window.innerHeight * 0.68
            ? rect.top - 10
            : rect.bottom + 10,
        above: rect.bottom > window.innerHeight * 0.68,
      });
    };
    const hide = () => setTooltip(null);
    const pointerOver = (event: PointerEvent) => {
      const element = targetElement(event.target);
      if (element) show(element);
    };
    const focusIn = (event: FocusEvent) => {
      const element = targetElement(event.target);
      if (element) show(element);
    };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement) prepare(node);
        }
      }
    });

    document.addEventListener("pointerover", pointerOver, true);
    document.addEventListener("pointerout", hide, true);
    document.addEventListener("focusin", focusIn, true);
    document.addEventListener("focusout", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerover", pointerOver, true);
      document.removeEventListener("pointerout", hide, true);
      document.removeEventListener("focusin", focusIn, true);
      document.removeEventListener("focusout", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  if (!tooltip) return null;

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-primary/20 bg-card px-3.5 py-2.5 text-right text-sm leading-6 text-card-foreground shadow-xl"
      dir="rtl"
      id={TOOLTIP_ID}
      lang="fa"
      role="tooltip"
      style={{
        left: tooltip.left,
        top: tooltip.top,
        transform: tooltip.above
          ? "translate(-50%, -100%)"
          : "translateX(-50%)",
      }}
    >
      {tooltip.text}
    </div>
  );
}
