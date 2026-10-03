import { describe, expect, test } from "bun:test";
import {
  isTrustedOrigin,
  normalizeWerkzeugSettings,
  settingsForClient,
} from "../lib/werkzeug-settings";

describe("central settings boundary", () => {
  test("preserves accessibility choices and rejects unsafe origins", () => {
    const settings = normalizeWerkzeugSettings({
      accessibility: { readingRuler: false, largerText: true },
      integration: {
        trustedOrigins: ["http://127.0.0.1:4312", "javascript:alert(1)"],
      },
    });

    expect(settings.accessibility.readingRuler).toBe(false);
    expect(settings.accessibility.largerText).toBe(true);
    expect(settings.integration.trustedOrigins).toEqual(["http://127.0.0.1:4312"]);
  });

  test("shares only granted settings with an exact registered app", () => {
    const origin = "http://127.0.0.1:4324";
    const settings = normalizeWerkzeugSettings({
      integration: {
        clients: [{
          id: "pdf-reader",
          displayName: "PDF Reader",
          origin,
          enabled: true,
          grants: ["accessibility"],
        }],
      },
    });

    expect(isTrustedOrigin(settings, origin, "http://127.0.0.1:4325")).toBe(true);
    const shared = settingsForClient(settings, origin) as Record<string, unknown>;
    expect(shared.accessibility).toBeDefined();
    expect(shared.profile).toBeUndefined();
    expect(shared.permissions).toBeUndefined();
  });
});
