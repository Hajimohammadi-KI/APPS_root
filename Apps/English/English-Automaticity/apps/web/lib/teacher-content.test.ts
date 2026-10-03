import { describe, expect, test } from "bun:test";

import {
  createTeacherContentPackage,
  ensureTeacherContextKey,
  isPublishedTeacherContent,
  parseTeacherContentPackage,
  type TeacherContentItem,
} from "./teacher-content";
import { originalEnglishStarterContent } from "./original-starter-content";

const item: TeacherContentItem = {
  id: "4a4ffb30-9af9-4132-8e5d-d39ad4e16298",
  kind: "conversation",
  level: "A1",
  title: "Talk about your family",
  body: "Speak for one minute.",
  contextKey: "",
  updatedAt: "2026-08-28T00:00:00.000Z",
};

describe("English teacher content workflow", () => {
  test("generates a stable internal key from teacher inputs", () => {
    expect(ensureTeacherContextKey(item)).toBe(
      "teacher.a1.conversation.talk-about-your-family.4a4ffb30",
    );
  });

  test("only serves newly published material to learners", () => {
    expect(isPublishedTeacherContent(item)).toBe(true);
    expect(isPublishedTeacherContent({ ...item, status: "draft" })).toBe(false);
    expect(isPublishedTeacherContent({ ...item, status: "review" })).toBe(
      false,
    );
    expect(isPublishedTeacherContent({ ...item, status: "published" })).toBe(
      true,
    );
  });

  test("exports portable text without human audio and validates imports", () => {
    const exported = createTeacherContentPackage([
      {
        ...item,
        status: "published",
        audioName: "teacher.mp3",
        audioType: "audio/mpeg",
      },
    ]);

    expect(exported.items[0]).not.toHaveProperty("audioName");
    expect(parseTeacherContentPackage(exported)).toEqual([
      { ...item, status: "published" },
    ]);
    expect(() => parseTeacherContentPackage({ format: "wrong" })).toThrow();
  });

  test("provides a complete original starter set without bundled audio", () => {
    expect(originalEnglishStarterContent).toHaveLength(24);
    expect(
      new Set(originalEnglishStarterContent.map((entry) => entry.id)).size,
    ).toBe(24);
    expect(
      new Set(originalEnglishStarterContent.map((entry) => entry.level)),
    ).toEqual(new Set(["A1", "A2", "B1", "B2", "C1", "C2"]));
    expect(
      originalEnglishStarterContent.every(
        (entry) => entry.status === "published",
      ),
    ).toBe(true);
    expect(originalEnglishStarterContent.some((entry) => entry.audioName)).toBe(
      false,
    );
  });
});
