import { beforeEach, expect, test } from "bun:test";
import { clientKey, rateLimit, resetRateLimits } from "./rate-limit";

const rule = { scope: "test", limit: 3, windowMs: 60_000 };
const from = (ip: string) => new Request("http://127.0.0.1:3201/api/ai", { headers: { "x-forwarded-for": ip } });

beforeEach(() => resetRateLimits());

test("allows requests up to the limit inside one window and then answers 429", () => {
  const now = 1_000_000;
  expect(rateLimit(from("1.1.1.1"), rule, now)).toBeNull();
  expect(rateLimit(from("1.1.1.1"), rule, now + 1)).toBeNull();
  expect(rateLimit(from("1.1.1.1"), rule, now + 2)).toBeNull();
  const blocked = rateLimit(from("1.1.1.1"), rule, now + 3);
  expect(blocked?.status).toBe(429);
  expect(Number(blocked?.headers.get("Retry-After"))).toBeGreaterThan(0);
});

test("counts clients and scopes separately and resets after the window", () => {
  const now = 1_000_000;
  for (let i = 0; i < 3; i += 1) rateLimit(from("1.1.1.1"), rule, now);
  expect(rateLimit(from("2.2.2.2"), rule, now)).toBeNull();
  expect(rateLimit(from("1.1.1.1"), { ...rule, scope: "other" }, now)).toBeNull();
  expect(rateLimit(from("1.1.1.1"), rule, now)?.status).toBe(429);
  expect(rateLimit(from("1.1.1.1"), rule, now + rule.windowMs)).toBeNull();
});

test("derives the client key from the first forwarded address", () => {
  expect(clientKey(from(" 9.9.9.9 , 10.0.0.1"))).toBe("9.9.9.9");
  expect(clientKey(new Request("http://127.0.0.1/", { headers: { "x-real-ip": "8.8.8.8" } }))).toBe("8.8.8.8");
  expect(clientKey(new Request("http://127.0.0.1/"))).toBe("local");
});
