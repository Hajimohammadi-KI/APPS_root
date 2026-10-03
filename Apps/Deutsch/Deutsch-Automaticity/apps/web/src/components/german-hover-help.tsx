"use client";

import * as React from "react";

const TOOLTIP_ID = "deutschflow-kontexthilfe";
const WORD_EXPRESSION =
  /[\p{Letter}\p{Mark}]+(?:[’'-][\p{Letter}\p{Mark}]+)*/gu;

type HelpEntry = Readonly<{
  term: string;
  meaning: string;
  clue?: string;
  example?: string;
}>;

const definitions: ReadonlyArray<
  Readonly<{ aliases: readonly string[]; entry: HelpEntry }>
> = [
  {
    aliases: ["nominativ"],
    entry: {
      term: "Nominativ",
      meaning:
        "Der Fall für das Subjekt: Wer oder was handelt oder ist gemeint?",
      clue: "Finde zuerst das finite Verb und frage dann: Wer oder was?",
      example: "Der ruhige Mann wartet.",
    },
  },
  {
    aliases: ["akkusativ"],
    entry: {
      term: "Akkusativ",
      meaning: "Häufig der Fall für das direkte Objekt.",
      clue: "Frage nach dem Subjekt: Wen oder was? Beim Maskulinum wird der meist zu den.",
      example: "Ich sehe den ruhigen Mann.",
    },
  },
  {
    aliases: ["dativ"],
    entry: {
      term: "Dativ",
      meaning:
        "Häufig der Fall für Empfänger, Beteiligte oder ein indirektes Objekt.",
      clue: "Frage: Wem? Lerne Verben und Präpositionen immer zusammen mit ihrem Kasus.",
      example: "Ich helfe dem ruhigen Mann.",
    },
  },
  {
    aliases: ["genitiv"],
    entry: {
      term: "Genitiv",
      meaning: "Der Fall für Besitz, Zugehörigkeit oder Abhängigkeit.",
      clue: "Frage: Wessen? Maskuline und neutrale Nomen erhalten häufig -s oder -es.",
      example: "Das Fahrrad des ruhigen Mannes ist neu.",
    },
  },
  {
    aliases: ["kasus", "fall", "fälle"],
    entry: {
      term: "Kasus",
      meaning: "Die grammatische Rolle einer Nomengruppe im Satz.",
      clue: "Bestimme erst die Satzrolle und bilde danach Artikel und Endungen.",
    },
  },
  {
    aliases: ["deklination", "deklinieren", "dekliniert"],
    entry: {
      term: "Deklination",
      meaning:
        "Die Veränderung von Artikel, Adjektiv, Pronomen oder Nomen nach Kasus, Genus und Numerus.",
      clue: "Prüfe in dieser Reihenfolge: Kasus, Genus, Artikelart.",
      example: "der gute Plan → mit dem guten Plan",
    },
  },
  {
    aliases: ["adjektivdeklination", "adjektivendung", "adjektivendungen"],
    entry: {
      term: "Adjektivdeklination",
      meaning: "Die Adjektivendung zeigt Merkmale der Nomengruppe.",
      clue: "Zeigt der Artikel den Kasus deutlich, trägt das Adjektiv meist -e oder -en.",
      example: "ein guter Plan · einen guten Plan · mit einem guten Plan",
    },
  },
  {
    aliases: ["artikel", "artikeln"],
    entry: {
      term: "Artikel",
      meaning:
        "Ein Begleiter des Nomens, der Genus, Numerus und Kasus sichtbar machen kann.",
      clue: "Lerne Nomen mit Artikel, Pluralform und einem kurzen Beispielsatz.",
      example: "der Termin · den Termin · dem Termin · des Termins",
    },
  },
  {
    aliases: ["endung", "endungen"],
    entry: {
      term: "Endung",
      meaning: "Der Wortausgang, der grammatische Informationen trägt.",
      clue: "Vergleiche nur die Endung im aktuellen Satz, statt sofort eine ganze Tabelle zu lernen.",
      example: "ruhige Frau · ruhigen Mann",
    },
  },
  {
    aliases: ["subjekt", "subjekte"],
    entry: {
      term: "Subjekt",
      meaning:
        "Die Satzgröße, mit der das finite Verb übereinstimmt; sie steht im Nominativ.",
      clue: "Finde das Verb und frage: Wer oder was handelt?",
      example: "Die Studentin schreibt.",
    },
  },
  {
    aliases: ["objekt", "objekte", "akkusativobjekt", "dativobjekt"],
    entry: {
      term: "Objekt",
      meaning:
        "Eine Ergänzung, deren Kasus vom Verb oder von einer Präposition bestimmt wird.",
      clue: "Lerne die Verbindung als Einheit: sehen + Akkusativ, helfen + Dativ.",
    },
  },
  {
    aliases: ["präposition", "präpositionen"],
    entry: {
      term: "Präposition",
      meaning: "Ein Wort für Beziehungen wie Ort, Zeit, Richtung oder Grund.",
      clue: "Lerne sie mit Kasus und Beispiel: mit + Dativ, für + Akkusativ.",
    },
  },
  {
    aliases: ["wechselpräposition", "wechselpräpositionen"],
    entry: {
      term: "Wechselpräposition",
      meaning:
        "Eine Präposition, die je nach Bedeutung Dativ oder Akkusativ verlangt.",
      clue: "Wo? → Dativ. Wohin? → Akkusativ.",
      example: "Das Buch liegt auf dem Tisch. · Ich lege es auf den Tisch.",
    },
  },
  {
    aliases: ["pronomen", "pronomens"],
    entry: {
      term: "Pronomen",
      meaning: "Ein Wort, das für ein Nomen oder eine Nomengruppe steht.",
      clue: "Übe als Reihe: er → ihn → ihm; sie → sie → ihr.",
    },
  },
  {
    aliases: ["genus", "geschlecht", "maskulin", "feminin", "neutrum"],
    entry: {
      term: "Genus",
      meaning:
        "Das grammatische Geschlecht eines Nomens: maskulin, feminin oder neutral.",
      clue: "Lerne ein neues Nomen immer mit seinem Artikel.",
      example: "der Tisch · die Lampe · das Buch",
    },
  },
  {
    aliases: ["numerus", "singular", "plural"],
    entry: {
      term: "Numerus",
      meaning: "Die Unterscheidung zwischen Einzahl und Mehrzahl.",
      clue: "Speichere bei jedem neuen Nomen auch seine Pluralform.",
    },
  },
  {
    aliases: ["automatik", "automatisch", "automatisierung"],
    entry: {
      term: "Automatisierung",
      meaning:
        "Eine richtige Form mit wenig Verzögerung in einer neuen Situation verwenden.",
      clue: "Rufe ein kurzes Muster an mehreren Tagen mit neuen Wörtern aus dem Gedächtnis ab.",
    },
  },
];

const controlHelp: ReadonlyArray<readonly [string, string]> = [
  ["startseite", "Öffnet die Lernübersicht und die nächste empfohlene Aktion."],
  [
    "heute lernen",
    "Öffnet die heutige Folge aus Abruf, Reparatur und neuer Anwendung.",
  ],
  [
    "gesprächsstudio",
    "Öffnet Aufnahme, Gespräch und Rückmeldung zur gesprochenen Antwort.",
  ],
  ["grammatik", "Öffnet Grammatikthemen, Erklärungen und gezielte Übungen."],
  ["wiederhol", "Zeigt Übungen, deren nächster Abruf jetzt fällig ist."],
  ["fehler", "Zeigt gespeicherte Fehler und eine kurze Reparaturübung."],
  [
    "einstellungen",
    "Öffnet Lern-, Lese-, Datenschutz- und Sicherungseinstellungen.",
  ],
  ["speichern", "Speichert die aktuelle Änderung auf diesem Gerät."],
  ["start", "Startet die gewählte Aktivität."],
  ["prüfen", "Prüft die Antwort am Ziel der aktuellen Aufgabe."],
  ["weiter", "Führt nach dem aktuellen Schritt zum nächsten Schritt."],
  ["zurück", "Kehrt zum vorherigen Schritt oder zur vorherigen Seite zurück."],
];

const wordIndex = new Map<string, HelpEntry>();
for (const definition of definitions) {
  for (const alias of definition.aliases)
    wordIndex.set(normalize(alias), definition.entry);
}

const interactiveSelector = [
  "[data-context-help]",
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

const ignoredWordSelector = [
  "input",
  "textarea",
  "select",
  "option",
  "script",
  "style",
  "code",
  "pre",
  `#${TOOLTIP_ID}`,
].join(",");

type CaretDocument = Document & {
  caretPositionFromPoint?: (
    x: number,
    y: number,
  ) => { offsetNode: Node; offset: number } | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

type TooltipState = Readonly<{
  key: string;
  entry: HelpEntry;
  left: number;
  top: number;
  above: boolean;
}>;

function normalize(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("de")
    .replace(/[’]/gu, "'")
    .trim();
}

function controlEntry(target: EventTarget | null): HelpEntry | null {
  if (!(target instanceof Element)) return null;
  const element = target.closest<HTMLElement>(interactiveSelector);
  if (!element || element.closest(`#${TOOLTIP_ID}`)) return null;
  const custom = element.dataset.contextHelp;
  if (custom) return { term: "Hinweis zu dieser Option", meaning: custom };
  const label = (
    element.getAttribute("aria-label") ||
    element.textContent ||
    element.getAttribute("placeholder") ||
    ""
  )
    .replace(/\s+/gu, " ")
    .trim();
  const match = controlHelp.find(([key]) =>
    normalize(label).includes(normalize(key)),
  );
  if (match) return { term: label.slice(0, 70), meaning: match[1] };
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    return {
      term: label || "Auswahl",
      meaning:
        "Aktiviere oder deaktiviere diese Option mit dem Kontrollkästchen.",
    };
  }
  return null;
}

function wordAtPoint(x: number, y: number) {
  const surface = document.elementFromPoint(x, y);
  if (!surface || surface.closest(ignoredWordSelector)) return null;
  const caretDocument = document as CaretDocument;
  const caret = caretDocument.caretPositionFromPoint?.(x, y);
  const fallbackRange = !caret
    ? caretDocument.caretRangeFromPoint?.(x, y)
    : null;
  const node = caret?.offsetNode ?? fallbackRange?.startContainer;
  const offset = caret?.offset ?? fallbackRange?.startOffset;
  if (!(node instanceof Text) || offset === undefined || !node.parentElement)
    return null;
  for (const match of node.data.matchAll(WORD_EXPRESSION)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (offset < start || offset > end) continue;
    const entry = wordIndex.get(normalize(match[0]));
    if (!entry) return null;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    return { entry, rect: range.getBoundingClientRect() };
  }
  return null;
}

function positionFor(rect: DOMRect, entry: HelpEntry): TooltipState {
  const above = rect.bottom > window.innerHeight * 0.64;
  return {
    key: `hilfe:${entry.term}:${Math.round(rect.left)}:${Math.round(rect.top)}`,
    entry,
    left: Math.min(
      Math.max(rect.left + rect.width / 2, 184),
      window.innerWidth - 184,
    ),
    top: above ? rect.top - 12 : rect.bottom + 12,
    above,
  };
}

export function GermanHoverHelp() {
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);
  const pendingKey = React.useRef("");
  const activeKey = React.useRef("");
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const cancelPending = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      pendingKey.current = "";
    };
    const hide = () => {
      cancelPending();
      activeKey.current = "";
      setTooltip(null);
    };
    const schedule = (next: TooltipState) => {
      if (activeKey.current === next.key || pendingKey.current === next.key)
        return;
      cancelPending();
      pendingKey.current = next.key;
      timer.current = setTimeout(() => {
        activeKey.current = next.key;
        setTooltip(next);
        pendingKey.current = "";
      }, 280);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const hit = wordAtPoint(event.clientX, event.clientY);
      if (hit) return schedule(positionFor(hit.rect, hit.entry));
      const entry = controlEntry(event.target);
      if (entry && event.target instanceof Element) {
        const element = event.target.closest<HTMLElement>(interactiveSelector);
        if (element)
          return schedule(positionFor(element.getBoundingClientRect(), entry));
      }
      if (activeKey.current || pendingKey.current) hide();
    };
    const onFocus = (event: FocusEvent) => {
      const entry = controlEntry(event.target);
      if (!entry || !(event.target instanceof HTMLElement)) return;
      cancelPending();
      activeKey.current = `fokus:${entry.term}`;
      setTooltip(positionFor(event.target.getBoundingClientRect(), entry));
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("focusout", hide, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      cancelPending();
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("focusout", hide, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  if (!tooltip) return null;
  return (
    <aside
      className="persian-word-help-card"
      dir="ltr"
      id={TOOLTIP_ID}
      lang="de"
      role="tooltip"
      style={{
        left: tooltip.left,
        top: tooltip.top,
        transform: tooltip.above
          ? "translate(-50%, -100%)"
          : "translateX(-50%)",
      }}
    >
      <p className="persian-word-help-term">{tooltip.entry.term}</p>
      <div className="persian-word-help-section">
        <strong>Einfache Bedeutung</strong>
        <span>{tooltip.entry.meaning}</span>
      </div>
      {tooltip.entry.clue ? (
        <div className="persian-word-help-section">
          <strong>Erkennen und anwenden</strong>
          <span>{tooltip.entry.clue}</span>
        </div>
      ) : null}
      {tooltip.entry.example ? (
        <div className="persian-word-help-example">
          <strong>Eigenes Beispiel</strong>
          <bdi dir="ltr">{tooltip.entry.example}</bdi>
        </div>
      ) : null}
    </aside>
  );
}
