import { expect, test } from "bun:test";
import { contentSecurityPolicy, securityHeaders } from "../../security-headers";

test("Die Produktionsrichtlinie blockiert Einbettung, Plugins und eval, lokale Dienste bleiben erreichbar", () => {
  const csp = contentSecurityPolicy(true);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).toContain("connect-src 'self' https: http://127.0.0.1:*");
  expect(csp).toContain("media-src 'self' blob:");
  expect(contentSecurityPolicy(false)).toContain("'unsafe-eval'");
});

test("Jede Antwort trägt die Schutz-Header", () => {
  const keys = securityHeaders(true).map((header) => header.key);
  expect(keys).toEqual([
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]);
  const permissions = securityHeaders(true).find(
    (header) => header.key === "Permissions-Policy",
  );
  expect(permissions?.value).toContain("microphone=(self)");
});
