"use client";

import * as React from "react";

const TOOLTIP_ID = "english-automaticity-persian-help";

const exactHelp: Record<string, string> = {
  Home: "Opens your learning overview and the next suggested action.",
  "Daily Training": "Opens today's scheduled practice in order.",
  "Conversation Studio": "Used for free speaking practice, recording, and corrections.",
  "Automaticity Path": "Shows the steps that turn grammar knowledge into fast, natural use.",
  "Grammar Lab": "Opens all grammar topics, explanations, and practice tasks.",
  "Q: Skills": "Shows Q: Skills units by level and lesson.",
  Resources: "Shows trusted resources and extra practice materials.",
  "Error Workshop": "Opens saved errors and scheduled repair practice.",
  "Audio Library": "Shows saved voice recordings and speaking progress.",
  Settings: "Opens learning, accessibility, privacy, and backup settings.",
  Help: "Opens a short guide for using the app.",
  "Read aloud": "Reads the page text with system voice.",
  Install: "Opens installation guidance for this device.",
  Save: "Saves current changes on this device.",
  Cancel: "Closes this panel without saving new changes.",
  Back: "Returns to the previous step or page.",
  Continue: "Moves to the next step or page.",
  Start: "Starts the selected practice activity.",
  Check: "Checks your response against the task goal.",
  Repeat: "Repeats this content to strengthen memory.",
  Delete: "Removes the selected item after confirmation.",
};

const partialHelp: ReadonlyArray<readonly [string, string]> = [
  ["level", "Manages your selected level and required evidence for progress."],
  ["speaking", "Opens or records speaking practice and evidence."],
  ["writing", "Opens or records writing practice and evidence."],
  ["grammar", "Shows grammar-related content or practice."],
  ["audio", "Plays, saves, or manages related recordings."],
  ["error", "Shows the error and its repair path."],
  ["progress", "Shows tracked progress and the next step."],
  ["search", "Searches within the current section."],
  ["filter", "Limits the currently displayed items."],
  ["open", "Opens the selected section or item."],
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
      ? element
          .querySelector<HTMLElement>("h1, h2, h3, h4, legend")
          ?.textContent?.trim() ?? ""
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
      ? `This button runs the action "${excerpt}".`
      : "This button runs the related action.";
  }
  if (kind === "link") {
    return excerpt
      ? `This link opens the section or resource "${excerpt}".`
      : "This link opens the related section.";
  }
  if (kind === "input") {
    return excerpt
      ? `Enter or select information for "${excerpt}" here.`
      : "Enter or select the related information here.";
  }
  if (kind === "checkbox") {
    return excerpt
      ? `Turns "${excerpt}" on or off.`
      : "Turns this option on or off.";
  }
  if (kind === "label") {
    return excerpt
      ? `This label describes the field topic "${excerpt}".`
      : "This label describes the related field.";
  }
  if (kind === "heading") {
    return excerpt
      ? `This heading introduces the section "${excerpt}".`
      : "This heading introduces the section below.";
  }
  if (kind === "box") {
    return excerpt
      ? `This panel groups information and controls for "${excerpt}".`
      : "This panel groups related information.";
  }
  return excerpt
    ? `This text explains "${excerpt}".`
    : "This text explains the current section.";
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
