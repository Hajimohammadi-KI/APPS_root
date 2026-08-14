import { describe, expect, test } from "bun:test";
import { TaskCatalog } from "./task-catalog";
import { assertTaskLifecycleTransition } from "./task-lifecycle";

const baseDefinition = {
  taskId: "task-ordering-food",
  contentVersion: "ordering-food-1.0.0",
  rubricId: "speaking-a2",
  rubricVersion: "1.0.0",
  checksum: "a".repeat(64),
  definition: Object.freeze({ prompt: "Order a drink." }),
} as const;

describe("task lifecycle", () => {
  test("accepts guarded publication and rejects draft-to-published", () => {
    expect(
      assertTaskLifecycleTransition("approved", "published", {
        approvedAt: "2026-08-14T10:00:00.000Z",
      }).eventType,
    ).toBe("published");
    expect(() => assertTaskLifecycleTransition("draft", "published")).toThrow(
      "Invalid task lifecycle transition",
    );
  });

  test("requires a published successor for deprecation", () => {
    expect(() =>
      assertTaskLifecycleTransition("published", "deprecated", {
        reasonCode: "superseded",
      }),
    ).toThrow("requires a published replacement");
  });
});

describe("task catalog", () => {
  const catalog = new TaskCatalog([
    { ...baseDefinition, taskVersion: "1.0.0", lifecycleState: "deprecated" },
    {
      ...baseDefinition,
      taskVersion: "1.1.0",
      lifecycleState: "published",
      publishedAt: "2026-08-10T10:00:00.000Z",
    },
    {
      ...baseDefinition,
      taskVersion: "1.2.0",
      lifecycleState: "published",
      publishedAt: "2026-08-14T10:00:00.000Z",
    },
    { ...baseDefinition, taskVersion: "2.0.0", lifecycleState: "blocked" },
  ]);

  test("resolves the exact historical version even after deprecation", () => {
    expect(catalog.resolveHistorical(baseDefinition.taskId, "1.0.0").taskVersion).toBe(
      "1.0.0",
    );
  });

  test("selects the highest published version for a new attempt", () => {
    expect(catalog.resolveForNewAttempt(baseDefinition.taskId).taskVersion).toBe("1.2.0");
  });
});
