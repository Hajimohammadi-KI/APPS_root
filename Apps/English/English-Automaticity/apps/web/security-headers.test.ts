import { expect, test } from "bun:test";
import { contentSecurityPolicy, securityHeaders } from "./security-headers.mjs";

test("production policy blocks framing, plugins and eval while keeping local services reachable", () => {
  const csp = contentSecurityPolicy(true);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("object-src 'none'");
  expect(csp).not.toContain("unsafe-eval");
  expect(csp).toContain("connect-src 'self' https: http://127.0.0.1:*");
  expect(csp).toContain("media-src 'self' blob:");
  expect(contentSecurityPolicy(false)).toContain("'unsafe-eval'");
});

test("every response carries the four protective headers", () => {
  const keys = securityHeaders(true).map((header) => header.key);
  expect(keys).toEqual([
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]);
  const permissions = securityHeaders(true).find((header) => header.key === "Permissions-Policy");
  expect(permissions?.value).toContain("microphone=(self)");
});
