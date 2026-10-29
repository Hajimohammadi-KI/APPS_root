import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
for (const app of [
  "English/English-Automaticity",
  "Deutsch/Deutsch-Automaticity",
]) {
  test(`${app}: PWA installation caches the shared text dependency before offline grammar practice`, async () => {
    const listeners = new Map();
    const cached = [];
    const pending = [];
    const source = readFileSync(
      new URL(`../Apps/${app}/apps/web/public/sw.js`, import.meta.url),
      "utf8",
    );
    runInNewContext(source, {
      self: {
        addEventListener: (type, listener) => listeners.set(type, listener),
        skipWaiting() {},
      },
      caches: {
        open: async () => ({
          add: async (path) => cached.push(path),
          addAll: async (paths) => cached.push(...paths),
        }),
      },
    });
    listeners.get("install")({ waitUntil: (promise) => pending.push(promise) });
    await Promise.all(pending);
    expect(cached).toContain("/learning-core/text.js");
  });
}
