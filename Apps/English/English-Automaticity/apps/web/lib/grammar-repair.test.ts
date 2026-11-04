import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const publicRoot = resolve(import.meta.dir, "../public");
const html = readFileSync(
  resolve(publicRoot, "replacements/en/grammar.html"),
  "utf8",
);
const textRuntime = readFileSync(
  resolve(publicRoot, "learning-core/text.js"),
  "utf8",
);
const draftRuntime = readFileSync(
  resolve(publicRoot, "device-access/grammar-drafts.js"),
  "utf8",
);

class Element {
  value = "";
  className = "";
  disabled = false;
  open = false;
  style = {};
  innerHTML = "";
  private text = "";
  private children: (Element | string)[] = [];
  private classes = new Set<string>();
  private listeners = new Map<string, (() => void)[]>();
  classList = {
    add: (name: string) => this.classes.add(name),
    remove: (name: string) => this.classes.delete(name),
    contains: (name: string) => this.classes.has(name),
  };
  get textContent(): string {
    return (
      this.text +
      this.children
        .map((child) => (typeof child === "string" ? child : child.textContent))
        .join("")
    );
  }
  set textContent(value: string) {
    this.text = value;
    this.children = [];
  }
  append(...children: (Element | string)[]) {
    this.children.push(...children);
  }
  replaceChildren(...children: (Element | string)[]) {
    this.text = "";
    this.children = children;
  }
  addEventListener(name: string, listener: () => void) {
    const entries = this.listeners.get(name) ?? [];
    entries.push(listener);
    this.listeners.set(name, entries);
  }
  click() {
    for (const listener of this.listeners.get("click") ?? []) listener();
  }
  focus() {}
  setAttribute() {}
  removeAttribute() {}
}

interface SavedResponse {
  inputText: string;
  mode: string;
  assistanceUsed: boolean;
}

function page(
  open = false,
  hint = "Check the subject and its present verb form.",
) {
  const elements = new Map<string, Element>();
  const get = (selector: string) => {
    let value = elements.get(selector);
    if (!value) {
      value = new Element();
      elements.set(selector, value);
    }
    return value;
  };
  const storage = new Map<string, string>();
  const completed = new Set<string>();
  let identity = 0;
  const unit = {
    rule: "Use the present form of be with the subject.",
    commonError: hint,
    exercises: [
      [
        "Complete: I ___ ready. (be)",
        "I am ready.",
        {
          answerRole: open ? "inspiration" : "expected",
          acceptedAnswers: ["I'm ready."],
          rejectedAnswers: [
            {
              answer: "I is ready.",
              explanation: "Check subject–verb agreement.",
            },
          ],
        },
      ],
    ],
  };
  const context: Record<string, unknown> = {
    document: { createElement: () => new Element() },
    $: get,
    $$: () => [],
    grammarUnit: () => unit,
    progress: { taskIndex: 0, activeLevel: "A1", activeTopic: "Be" },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    crypto: { randomUUID: () => String(++identity) },
    topicKey: () => "A1::Be::0",
    topicCompleted: () => 0,
    levelCompleted: () => 0,
    exerciseCount: () => 1,
    curriculum: { A1: ["Be"] },
    completedSet: completed,
    saveProgress: () => {},
    renderCurriculum: () => {},
    dailyContext: null,
    Date,
  };
  context.window = context;
  runInNewContext(textRuntime, context);
  runInNewContext(draftRuntime, context);
  const start = html.indexOf("// Recall task behavior.");
  const end = html.indexOf('nextBtn.addEventListener("click"', start);
  if (start < 0 || end < 0)
    throw new Error("Grammar Lab handler slice missing");
  runInNewContext(`${html.slice(start, end)}\nresetTask();`, context);
  return {
    get,
    completed,
    history: (): SavedResponse[] =>
      JSON.parse(
        storage.get("english-automaticity:grammar-open-responses:v1") ?? "[]",
      ),
    submit: (response: string) => {
      get("#answerInput").value = response;
      get("#checkBtn").click();
    },
    repair: (response: string) => {
      get("#repairInput").value = response;
      get("#repairBtn").click();
    },
  };
}

test("a reviewed wrong answer gets a repair opportunity without automatically revealing the model", () => {
  const view = page();
  view.submit("I is ready.");
  expect(view.get("#feedback").textContent).not.toContain("I am ready.");
  expect(view.get("#feedback").textContent).not.toContain("Model:");
  expect(view.get("#answerInput").value).toBe("I is ready.");
  expect(view.get("#answerInput").disabled).toBe(false);
  expect(view.get("#repairBox").classList.contains("show")).toBe(true);
  view.get("#modelBtn").click();
  expect(view.get("#feedback").textContent).toContain("I am ready.");
});

test("a repair accepts the same reviewed alternative as the original check and keeps the original response", () => {
  const view = page();
  view.submit("I is ready.");
  view.repair("I'm ready.");
  expect(view.completed.size).toBe(1);
  expect(view.get("#feedback").className).toContain("good");
  expect(view.get("#feedback").textContent).toContain(
    "does not establish independent",
  );
  expect(view.history()).toEqual([
    expect.objectContaining({
      inputText: "I is ready.",
      mode: "writing",
      assistanceUsed: false,
    }),
    expect.objectContaining({
      inputText: "I'm ready.",
      mode: "repair",
      assistanceUsed: true,
    }),
  ]);
});

test("an unknown repair remains unscored and does not become a grammar error or a completed answer", () => {
  const view = page();
  view.submit("I is ready.");
  view.repair("I was ready.");
  expect(view.completed.size).toBe(0);
  expect(view.get("#feedback").className).not.toContain("bad");
  expect(view.get("#feedback").className).not.toContain("good");
  expect(view.get("#feedback").textContent).toContain("without a score");
  expect(view.get("#feedback").textContent).not.toContain("I am ready.");
});

test("a known wrong repair never passes, while requesting the model records assisted practice", () => {
  const view = page();
  view.get("#modelBtn").click();
  view.submit("I is ready.");
  view.repair("I is ready.");
  expect(view.completed.size).toBe(0);
  expect(view.get("#feedback").className).toContain("bad");
  expect(view.history().every((row) => row.assistanceUsed)).toBe(true);
});

test("unscored closed and open responses do not automatically expose a model", () => {
  for (const open of [false, true]) {
    const view = page(open);
    view.submit("I was ready.");
    expect(view.get("#feedback").textContent).not.toContain("I am ready.");
    expect(view.get("#feedback").className).not.toContain("bad");
    view.get("#modelBtn").click();
    expect(view.get("#feedback").textContent).toContain("I am ready.");
  }
});

test("a hint containing the complete model stays hidden until the learner requests a model", () => {
  const view = page(false, "One model: I am ready.");
  view.get("#hintBtn").click();
  expect(view.get("#feedback").textContent).not.toContain("I am ready.");
  view.get("#modelBtn").click();
  expect(view.get("#feedback").textContent).toContain("I am ready.");
});
