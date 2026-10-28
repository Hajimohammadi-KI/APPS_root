import { describe, expect, test } from "bun:test";
import { allowedOrigins, DEFAULT_CORS_ORIGINS } from "../src/cors";

describe("API CORS allowlist", () => {
  test("defaults to local hosts plus the canonical production origin only", () => {
    const origins = allowedOrigins(undefined);
    expect(origins).toEqual(DEFAULT_CORS_ORIGINS);
    expect(origins).toContain("https://english-grammar-automaticity-pwa.vercel.app");
    expect(origins.every((origin) => typeof origin === "string")).toBe(true);
  });

  test("never accepts other Vercel-hosted sites", () => {
    const origins = allowedOrigins(undefined);
    expect(origins).not.toContain("https://attacker-site.vercel.app");
    expect(origins.some((origin) => origin.includes("*"))).toBe(false);
  });

  test("CORS_ORIGINS replaces the default list after trimming", () => {
    expect(allowedOrigins(" https://a.example , https://b.example ,")).toEqual([
      "https://a.example",
      "https://b.example",
    ]);
    expect(allowedOrigins("  ,  ")).toEqual(DEFAULT_CORS_ORIGINS);
  });
});
