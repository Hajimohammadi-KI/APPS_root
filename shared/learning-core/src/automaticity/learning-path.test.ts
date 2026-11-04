import { describe, expect, test } from "bun:test";
import { assessControlledTask } from "./assessment";
import type { AttemptEvent, Language } from "./contracts";
import type { CurriculumPack, PracticeTask } from "./curriculum";
import { resolveLearningPath, saveLearningPathChoice } from "./learning-path";
import { sessionKey, type LocalStore } from "./storage";

const at = "2026-11-04T12:00:00.000Z";
class Store implements LocalStore {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
}
function curriculum(language: Language): CurriculumPack {
  return {
    version: "1",
    mappingVersion: "1",
    language,
    units: ["A1", "A1", "B1"].map((level, index) => {
      const id = `${language}.c.${index + 1}`;
      const task: PracticeTask = {
        id: `${id}.retrieve`,
        version: "1",
        constructionId: id,
        familyId: "G01",
        itemFamily: `${id}.family`,
        contextId: `${id}.context`,
        rubricVersion: "1",
        stage: "retrieve",
        modality: "writing",
        partition: "practice",
        transferCondition: "none",
        contentReview: "authored",
        prompt:
          language === "en"
            ? "Complete: I ___ ready. (be)"
            : "Ergänze: Ich ___ bereit. (sein)",
        answerPolicy: "closed",
        responseKind: "cloze",
        acceptedAnswers: [
          language === "en" ? "I am ready." : "Ich bin bereit.",
        ],
        hints: [],
        solution: language === "en" ? "I am ready." : "Ich bin bereit.",
        normalisation: {
          nfc: true,
          whitespace: true,
          terminalFullStop: true,
          preserveCase: true,
        },
        sourceId: "fixture",
      };
      return {
        id,
        language,
        level,
        title: `Topic ${index + 1}`,
        familyIds: ["G01"],
        prerequisites: index === 1 ? [`${language}.c.1`] : [],
        lessonAlias: `${level}::Topic ${index + 1}`,
        rule: "Fixture rule",
        examples: [],
        commonError: "Fixture",
        review: "authored",
        sources: [],
        tasks: [task],
      };
    }),
  };
}
function draft(
  store: Store,
  pack: CurriculumPack,
  index = 0,
  submittedId: string | null = null,
) {
  const task = pack.units[index]!.tasks[0]!;
  const bytes = JSON.stringify({
    version: 2,
    taskId: task.id,
    taskVersion: task.version,
    draft: "Unfinished learner words",
    startedAt: "2026-11-04T09:00:00.000Z",
    hintCount: 0,
    solutionRevealed: false,
    exampleSeen: false,
    selfReportedAssistance: false,
    previousAttemptId: null,
    submittedId,
    audioId: null,
  });
  store.setItem(sessionKey(pack.language), bytes);
  return bytes;
}
for (const language of ["en", "de"] as const)
  describe(`${language} common learning path`, () => {
    const pack = curriculum(language);
    test("fresh entry uses the shared prerequisites and reads without changing storage", () => {
      const store = new Store();
      const selection = resolveLearningPath(pack, store, at);
      expect(selection?.unit.id).toBe(`${language}.c.1`);
      expect(selection?.source).toBe("recommendation");
      expect(selection?.href).toContain(encodeURIComponent(selection!.task.id));
      expect(store.length).toBe(0);
    });
    test("existing practice level wins over untimestamped app defaults", () => {
      const store = new Store();
      store.setItem(`automaticity:v2:${language}:level`, "B1");
      store.setItem(
        language === "en"
          ? "grammar-automaticity:v27"
          : "GrammarAutomaticityV11_de",
        JSON.stringify({ learner: { selfDeclaredLevel: "A1" } }),
      );
      const before = [...store.values];
      expect(resolveLearningPath(pack, store, at)?.level).toBe("B1");
      expect([...store.values]).toEqual(before);
    });
    test("legacy app-selected level and daily level are respected before A1 fallback", () => {
      const store = new Store();
      store.setItem(
        language === "en" ? "english-cefr-level" : "german-cefr-level",
        "B1",
      );
      expect(resolveLearningPath(pack, store, at)?.level).toBe("B1");
      store.removeItem(
        language === "en" ? "english-cefr-level" : "german-cefr-level",
      );
      store.setItem(
        language === "en"
          ? "grammar-automaticity:v27"
          : "GrammarAutomaticityV11_de",
        JSON.stringify({
          learningLevel: "B1",
          learner: { selfDeclaredLevel: "A1" },
        }),
      );
      expect(resolveLearningPath(pack, store, at)?.level).toBe("B1");
    });
    test("explicit topic and level override a saved draft without rewriting it", () => {
      const store = new Store();
      const original = draft(store, pack);
      const selection = resolveLearningPath(pack, store, at, {
        level: "B1",
        topic: "Topic 3",
      });
      expect(selection?.unit.id).toBe(`${language}.c.3`);
      expect(selection?.source).toBe("requested");
      expect(store.getItem(sessionKey(language))).toBe(original);
      expect(resolveLearningPath(pack, store, at, { level: "B1" })?.level).toBe(
        "B1",
      );
    });
    test("unfinished checked draft resumes before an older saved choice", () => {
      const store = new Store();
      draft(store, pack);
      saveLearningPathChoice(
        store,
        language,
        { level: "B1", topic: "Topic 3" },
        "2026-11-04T08:00:00.000Z",
      );
      expect(resolveLearningPath(pack, store, at)?.source).toBe("draft");
      expect(resolveLearningPath(pack, store, at)?.unit.id).toBe(
        `${language}.c.1`,
      );
    });
    test("a newer explicit choice bypasses the old draft and preserves all its bytes", () => {
      const store = new Store();
      const original = draft(store, pack);
      saveLearningPathChoice(
        store,
        language,
        { level: "B1", constructionId: `${language}.c.3` },
        "2026-11-04T10:00:00.000Z",
      );
      const selection = resolveLearningPath(pack, store, at);
      expect(selection?.unit.id).toBe(`${language}.c.3`);
      expect(selection?.source).toBe("saved_choice");
      expect(store.getItem(sessionKey(language))).toBe(original);
    });
    test("a saved topic remains selected even when other topics need review", () => {
      const store = new Store();
      const task = pack.units[0]!.tasks[0]!;
      const attempt: AttemptEvent = {
        version: 2,
        type: "attempt",
        id: "a",
        language,
        at: "2026-11-01T10:00:00.000Z",
        task,
        response: {
          text: task.acceptedAnswers[0]!,
          sha256: "a".repeat(64),
          originalTranscriptSha256: null,
          transcriptEdited: false,
        },
        timing: {
          startedAt: "2026-11-01T10:00:00.000Z",
          activeMs: null,
          firstInputMs: null,
          source: "unavailable",
        },
        assistance: {
          hintCount: 0,
          solutionRevealed: false,
          exampleSeen: false,
          selfReportedAssistance: false,
        },
        audio: null,
        previousAttemptId: null,
      };
      store.setItem(
        `automaticity:v2:${language}:event:a`,
        JSON.stringify(attempt),
      );
      store.setItem(
        `automaticity:v2:${language}:event:check`,
        JSON.stringify(
          assessControlledTask(attempt, task, attempt.at, "check"),
        ),
      );
      expect(resolveLearningPath(pack, store, at)?.unit.id).toBe(
        `${language}.c.1`,
      );
      saveLearningPathChoice(
        store,
        language,
        { level: "B1", topic: "Topic 3" },
        at,
      );
      expect(resolveLearningPath(pack, store, at)?.unit.id).toBe(
        `${language}.c.3`,
      );
    });
    test("corrupt preferences and drafts remain intact while a safe recommendation is shown", () => {
      const store = new Store();
      store.setItem(`automaticity:v2:${language}:choice`, "{unreadable");
      store.setItem(sessionKey(language), "{unfinished");
      const before = [...store.values];
      expect(resolveLearningPath(pack, store, at)?.unit.id).toBe(
        `${language}.c.1`,
      );
      expect([...store.values]).toEqual(before);
      expect(() =>
        saveLearningPathChoice(store, language, { level: "B1" }, at),
      ).toThrow("Unreadable saved learning choice");
      expect([...store.values]).toEqual(before);
    });
    test("a level-only choice clears the prior topic, without touching legacy preferences", () => {
      const store = new Store();
      saveLearningPathChoice(
        store,
        language,
        { level: "A1", topic: "Topic 2" },
        at,
      );
      saveLearningPathChoice(store, language, { level: "B1" }, at);
      expect(resolveLearningPath(pack, store, at)?.unit.id).toBe(
        `${language}.c.3`,
      );
      expect(store.getItem(`automaticity:v2:${language}:level`)).toBeNull();
    });
    test("unknown requested tasks and cross-language identities do not select foreign content", () => {
      expect(
        resolveLearningPath(pack, new Store(), at, {
          taskId: "missing",
          constructionId: "xx.c.1",
        })?.unit.language,
      ).toBe(language);
    });
  });

test("German use-today choice is restored and only a strictly newer legacy choice wins", () => {
  const store = new Store();
  const pack = curriculum("de");
  store.setItem(
    "deutsch-automaticity:today-grammar",
    JSON.stringify({
      level: "B1",
      topic: "Topic 3",
      updatedAt: "2026-11-04T11:00:00.000Z",
    }),
  );
  saveLearningPathChoice(
    store,
    "de",
    { level: "A1", topic: "Topic 2" },
    "2026-11-04T10:00:00.000Z",
  );
  expect(resolveLearningPath(pack, store, at)?.unit.id).toBe("de.c.3");
  saveLearningPathChoice(
    store,
    "de",
    { level: "A1", topic: "Topic 2" },
    "2026-11-04T11:00:00.000Z",
  );
  expect(resolveLearningPath(pack, store, at)?.unit.id).toBe("de.c.2");
});

test("English legacy use-today topic is restored without mutating the app state", () => {
  const store = new Store();
  const bytes = JSON.stringify({
    todayGrammar: { title: "Topic 3", level: "B1", date: "2026-11-04" },
    other: "preserve",
  });
  store.setItem("grammar-automaticity:v27", bytes);
  expect(resolveLearningPath(curriculum("en"), store, at)?.unit.id).toBe(
    "en.c.3",
  );
  expect(store.getItem("grammar-automaticity:v27")).toBe(bytes);
});

test("a newer unavailable legacy topic cannot replace a valid explicit choice", () => {
  const store = new Store();
  const pack = curriculum("de");
  saveLearningPathChoice(
    store,
    "de",
    { level: "B1", topic: "Topic 3" },
    "2026-11-04T10:00:00.000Z",
  );
  store.setItem(
    "deutsch-automaticity:today-grammar",
    JSON.stringify({
      level: "A1",
      topic: "Removed topic",
      updatedAt: "2026-11-04T11:00:00.000Z",
    }),
  );
  expect(resolveLearningPath(pack, store, at)?.unit.id).toBe("de.c.3");
});

test("automatic links respect reserved pilot content while explicit task requests stay available", () => {
  const pack = curriculum("de");
  const policyPack = { ...pack, units: pack.units.slice(1) };
  expect(
    resolveLearningPath(pack, new Store(), at, {}, policyPack)?.unit.id,
  ).toBe("de.c.2");
  expect(
    resolveLearningPath(
      pack,
      new Store(),
      at,
      { taskId: pack.units[0]!.tasks[0]!.id },
      policyPack,
    )?.unit.id,
  ).toBe("de.c.1");
});

test("the standard browser build includes the daily entry that displays the shared recommendation", async () => {
  const pkg = await Bun.file(
    new URL("../../package.json", import.meta.url),
  ).json();
  expect(pkg.scripts["build:automaticity"]).toContain("overview-entry.ts");
});
