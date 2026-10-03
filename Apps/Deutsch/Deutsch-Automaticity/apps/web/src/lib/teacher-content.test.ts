import { describe, expect, test } from "bun:test";

import {
  createTeacherContentPackage,
  ensureTeacherContextKey,
  isPublishedTeacherContent,
  parseTeacherContentPackage,
  type TeacherContentItem,
} from "./teacher-content";
import { originalGermanStarterContent } from "./original-starter-content";

const baseItem: TeacherContentItem = {
  id: "8d5a6ed2-a1ef-4a76-b716-9aecefba7c42",
  kind: "conversation",
  level: "A1",
  title: "Über Familie sprechen",
  body: "Eine kurze Gesprächsaufgabe.",
  contextKey: "",
  updatedAt: "2026-08-28T00:00:00.000Z",
};

describe("teacher content linking", () => {
  test("creates a stable link from normal teacher inputs", () => {
    expect(ensureTeacherContextKey(baseItem)).toBe(
      "teacher.a1.conversation.ueber-familie-sprechen.8d5a6ed2",
    );
  });

  test("keeps an existing link during editing", () => {
    expect(
      ensureTeacherContextKey({
        ...baseItem,
        contextKey: "conversation.a1.family",
      }),
    ).toBe("conversation.a1.family");
  });

  test("keeps old content available but protects new drafts from learners", () => {
    expect(isPublishedTeacherContent(baseItem)).toBe(true);
    expect(isPublishedTeacherContent({ ...baseItem, status: "draft" })).toBe(
      false,
    );
    expect(isPublishedTeacherContent({ ...baseItem, status: "review" })).toBe(
      false,
    );
    expect(
      isPublishedTeacherContent({ ...baseItem, status: "published" }),
    ).toBe(true);
  });

  test("exports portable text without human audio and validates imports", () => {
    const exported = createTeacherContentPackage([
      {
        ...baseItem,
        status: "published",
        audioName: "lehrkraft.mp3",
        audioType: "audio/mpeg",
      },
    ]);

    expect(exported.items[0]).not.toHaveProperty("audioName");
    expect(parseTeacherContentPackage(exported)).toEqual([
      { ...baseItem, status: "published" },
    ]);
    expect(() => parseTeacherContentPackage({ format: "wrong" })).toThrow();
  });

  test("stellt vollständige eigene Startinhalte ohne gebündeltes Audio bereit", () => {
    expect(originalGermanStarterContent).toHaveLength(24);
    expect(
      new Set(originalGermanStarterContent.map((entry) => entry.id)).size,
    ).toBe(24);
    expect(
      new Set(originalGermanStarterContent.map((entry) => entry.level)),
    ).toEqual(new Set(["A1", "A2", "B1", "B2", "C1", "C2"]));
    expect(
      originalGermanStarterContent.every(
        (entry) => entry.status === "published",
      ),
    ).toBe(true);
    expect(originalGermanStarterContent.some((entry) => entry.audioName)).toBe(
      false,
    );
  });
});
