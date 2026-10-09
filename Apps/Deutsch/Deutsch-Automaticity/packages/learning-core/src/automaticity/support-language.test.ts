import { expect, test } from "bun:test";
import {
  getSupportGuide,
  readSupportLanguage,
  saveSupportLanguage,
  supportLanguageKey,
} from "./support-language";

function storage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("unset language defaults to Persian without persisting or rewriting learner data", () => {
  const store = storage({ draft: "Ich helfe ihm.", events: "[1,2]" });
  expect(readSupportLanguage("en", store)).toBe("fa");
  expect(readSupportLanguage("de", store)).toBe("fa");
  expect([...store.values.keys()]).toEqual(["draft", "events"]);
});

test("existing English codes and German labels retain every explicit selection", () => {
  for (const code of ["fa", "en", "de"] as const) {
    const label = { fa: "فارسی", en: "English", de: "Deutsch" }[code];
    expect(
      readSupportLanguage(
        "en",
        storage({ "english-explanation-language": code }),
      ),
    ).toBe(code);
    expect(
      readSupportLanguage(
        "de",
        storage({ "deutsch-automaticity:explanation-language": label }),
      ),
    ).toBe(code);
  }
});

test("only preference is saved using compatible keys and formats", () => {
  const store = storage({ draft: "My sentence.", session: "{active:true}" });
  expect(saveSupportLanguage("de", "fa", store)).toBe(true);
  expect(store.getItem(supportLanguageKey("de"))).toBe("فارسی");
  expect(saveSupportLanguage("en", "de", store)).toBe(true);
  expect(store.getItem(supportLanguageKey("en"))).toBe("de");
  expect(store.getItem("draft")).toBe("My sentence.");
  expect(store.getItem("session")).toBe("{active:true}");
});

test("unavailable, denied and corrupt storage has safe non-destructive fallback", () => {
  expect(readSupportLanguage("de", null)).toBe("fa");
  expect(saveSupportLanguage("en", "en", null)).toBe(false);
  const denied = {
    getItem: () => {
      throw new Error("denied");
    },
    setItem: () => {
      throw new Error("denied");
    },
  };
  expect(readSupportLanguage("en", denied)).toBe("fa");
  expect(saveSupportLanguage("de", "en", denied)).toBe(false);
  for (const value of ["", "{broken", "null", "unknown", "\u200ben"]) {
    const store = storage({ "english-explanation-language": value });
    expect(readSupportLanguage("en", store)).toBe("fa");
    expect(store.getItem("english-explanation-language")).toBe(value);
  }
});

test("all seven stages have localized guidance with scoped direction and target response language", () => {
  for (const language of ["fa", "en", "de"] as const) {
    for (const stage of [
      "notice",
      "retrieve",
      "vary",
      "produce",
      "repair",
      "transfer",
      "retain",
    ] as const) {
      const guide = getSupportGuide(language, "de", { stage, familyId: "G04" });
      expect(guide.lang).toBe(language);
      expect(guide.dir).toBe(language === "fa" ? "rtl" : "ltr");
      expect(guide.stageText.length).toBeGreaterThan(25);
      expect(guide.topicText.length).toBeGreaterThan(10);
      expect(guide.targetNote).toContain(
        { fa: "آلمانی", en: "German", de: "Deutsch" }[language],
      );
    }
  }
});

test("model rules stay hidden by default and explicit fallback retains correct source language", () => {
  const sourceRule = "The model answer is secret.";
  expect(getSupportGuide("fa", "en", { sourceRule }).sourceRule).toBeNull();
  const guide = getSupportGuide("fa", "en", {
    sourceRule,
    allowSourceRule: true,
  });
  expect(guide.sourceRule).toEqual({
    text: sourceRule,
    lang: "en",
    dir: "ltr",
  });
  expect(guide.fallbackNote).toContain("انگلیسی");
  expect(
    getSupportGuide("de", "de", { sourceRule, allowSourceRule: true })
      .fallbackNote,
  ).toBe("");
  expect(
    getSupportGuide("en", "de", { familyId: "unknown", sourceRule: "" })
      .topicText,
  ).toBe("");
  expect(getSupportGuide("fa", "en").targetNote).toContain("انگلیسی");
});
