"use client";

import * as React from "react";

const TOOLTIP_ID = "english-automaticity-context-help";
const WORD_EXPRESSION =
  /[\p{Letter}\p{Mark}]+(?:[’'-][\p{Letter}\p{Mark}]+)*/gu;

type HelpEntry = Readonly<{
  term: string;
  meaning: string;
  clue?: string;
}>;

const definitions: ReadonlyArray<
  Readonly<{ aliases: readonly string[]; entry: HelpEntry }>
> = [
  {
    aliases: ["automaticity"],
    entry: {
      term: "Automaticity",
      meaning:
        "Using English quickly and accurately without rebuilding every rule in your head.",
      clue: "Recall a short pattern, use it in a new situation, and repeat it later without looking.",
    },
  },
  {
    aliases: ["mastery"],
    entry: {
      term: "Mastery",
      meaning:
        "Using a skill independently in a new situation, not merely completing a lesson.",
      clue: "Check the skill again after a delay and without hints.",
    },
  },
  {
    aliases: ["coverage"],
    entry: {
      term: "Coverage",
      meaning: "The amount of course content you have seen.",
      clue: "Coverage is useful, but it is not the same as mastery or fluent use.",
    },
  },
  {
    aliases: ["fluency", "fluent"],
    entry: {
      term: "Fluency",
      meaning: "Expressing meaning continuously with natural pauses.",
      clue: "Complete the message first; improve one accuracy problem on the next attempt.",
    },
  },
  {
    aliases: ["accuracy", "accurate"],
    entry: {
      term: "Accuracy",
      meaning: "Correct word choice, grammar, spelling, and pronunciation.",
      clue: "Repair one recurring error at a time to keep the task manageable.",
    },
  },
  {
    aliases: ["grammar", "grammatical"],
    entry: {
      term: "Grammar",
      meaning: "The patterns that organise words and meanings in a sentence.",
      clue: "Learn one short pattern, then rebuild it with new words of your own.",
    },
  },
  {
    aliases: ["vocabulary", "word", "words"],
    entry: {
      term: "Vocabulary",
      meaning: "Words, phrases, and combinations you can understand and use.",
      clue: "Learn a word with a useful phrase and one personal sentence.",
    },
  },
  {
    aliases: ["pronunciation", "pronounce"],
    entry: {
      term: "Pronunciation",
      meaning:
        "How speech sounds, stress, rhythm, and intonation are produced.",
      clue: "Listen, pause, imitate a short phrase, and compare your recording.",
    },
  },
  {
    aliases: ["speaking", "speak", "spoken"],
    entry: {
      term: "Speaking",
      meaning: "Turning language knowledge into a clear spoken message.",
      clue: "Respond with support, then with one keyword, and finally without help.",
    },
  },
  {
    aliases: ["listening", "listen"],
    entry: {
      term: "Listening",
      meaning:
        "Understanding a spoken message rather than translating every word.",
      clue: "Listen first for the main idea, then key words, and finally details.",
    },
  },
  {
    aliases: ["writing", "write", "written"],
    entry: {
      term: "Writing",
      meaning: "Building a clear, organised message in written form.",
      clue: "Finish the message, then check structure once and spelling once.",
    },
  },
  {
    aliases: ["reading", "read"],
    entry: {
      term: "Reading",
      meaning: "Understanding a text's purpose, structure, and information.",
      clue: "Read the title and first sentence of each paragraph before looking up words.",
    },
  },
  {
    aliases: ["recall", "retrieve", "retrieval"],
    entry: {
      term: "Recall",
      meaning: "Bringing learning back from memory before seeing the answer.",
      clue: "Pause, answer from memory, and only then compare.",
    },
  },
  {
    aliases: ["review", "reviews", "revision", "retention"],
    entry: {
      term: "Spaced review",
      meaning:
        "Returning to learning after increasing delays so it remains available.",
      clue: "Difficult items return sooner; stable items return later.",
    },
  },
  {
    aliases: ["feedback"],
    entry: {
      term: "Feedback",
      meaning: "A clear explanation of what worked and what to change next.",
      clue: "Useful feedback is short, specific, and immediately actionable.",
    },
  },
  {
    aliases: ["evidence", "transcript", "assessment"],
    entry: {
      term: "Learning evidence",
      meaning:
        "A recording, text, or independent response that demonstrates ability.",
      clue: "Completing an activity is not evidence until you can perform the skill.",
    },
  },
  {
    aliases: ["shadowing"],
    entry: {
      term: "Shadowing",
      meaning:
        "Repeating a short recording almost at the same time as the speaker.",
      clue: "Begin with three to seven words and increase speed gradually.",
    },
  },
  {
    aliases: ["chunk", "chunks"],
    entry: {
      term: "Chunk",
      meaning:
        "A group of words commonly used together and recalled as one unit.",
      clue: "Retrieve the whole phrase instead of isolated words.",
    },
  },
  {
    aliases: ["cefr"],
    entry: {
      term: "CEFR",
      meaning:
        "The European A1-C2 framework describing what a learner can do in real situations.",
      clue: "Measure progress by usable can-do performance, not only rule names.",
    },
  },
];

const controlHelp: ReadonlyArray<readonly [string, string]> = [
  ["home", "Open your learning overview and the next recommended action."],
  [
    "today’s practice",
    "Open today's adaptive recall, practice, and speaking sequence.",
  ],
  [
    "conversation studio",
    "Open recording, conversation, and spoken-response feedback.",
  ],
  ["grammar lab", "Open grammar topics, explanations, and targeted practice."],
  [
    "integrated skills",
    "Combine listening, speaking, reading, and writing in one task.",
  ],
  ["error workshop", "Review saved errors and practise a focused repair."],
  ["settings", "Open learning, accessibility, privacy, and backup settings."],
  ["save", "Save the current change on this device."],
  ["start", "Start the selected activity."],
  ["check", "Check the answer against this task's target."],
  ["continue", "Continue after completing the current step."],
];

const wordIndex = new Map<string, HelpEntry>();
for (const definition of definitions) {
  for (const alias of definition.aliases)
    wordIndex.set(normalize(alias), definition.entry);
}

const interactiveSelector = [
  "[data-context-help]",
  "button",
  "a[href]:not(.skip-link)",
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
    .toLocaleLowerCase("en")
    .replace(/[’]/gu, "'")
    .trim();
}

function controlEntry(target: EventTarget | null): HelpEntry | null {
  if (!(target instanceof Element)) return null;
  const element = target.closest<HTMLElement>(interactiveSelector);
  if (!element || element.closest(`#${TOOLTIP_ID}`)) return null;
  const custom = element.dataset.contextHelp;
  if (custom) return { term: "About this option", meaning: custom };
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
      term: label || "Toggle option",
      meaning: "Select or clear the box to turn this option on or off.",
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
  const inset = Math.min(196, window.innerWidth / 2);
  return {
    key: `help:${entry.term}:${Math.round(rect.left)}:${Math.round(rect.top)}`,
    entry,
    left: Math.min(
      Math.max(rect.left + rect.width / 2, inset),
      window.innerWidth - inset,
    ),
    top: above ? rect.top - 12 : rect.bottom + 12,
    above,
  };
}

export function ContextualHoverHelp() {
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
      activeKey.current = `focus:${entry.term}`;
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
      lang="en"
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
        <strong>Plain meaning</strong>
        <span>{tooltip.entry.meaning}</span>
      </div>
      {tooltip.entry.clue ? (
        <div className="persian-word-help-section">
          <strong>How to use it</strong>
          <span>{tooltip.entry.clue}</span>
        </div>
      ) : null}
    </aside>
  );
}
