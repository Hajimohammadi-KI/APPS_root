import { expect, test } from "bun:test";
import { isLocalAppHost, normalizeApiOrigin, usesDevicePractice } from "./api-origin";

test("legacy desktop endpoints migrate to same-origin; explicit remote endpoints survive", () => {
  for (const value of [undefined, "", "http://localhost:4201/", "http://127.0.0.1:4210/api/v1", "http://192.168.178.24:4201"])
    expect(normalizeApiOrigin(value)).toBe("");
  expect(normalizeApiOrigin("https://english-grammar-automaticity-pwa.vercel.app:4201", undefined, "english-grammar-automaticity-pwa.vercel.app")).toBe("");
  expect(normalizeApiOrigin(" https://api.example.test/v1/ ")).toBe("https://api.example.test/v1");
  expect(normalizeApiOrigin("http://localhost:4201", "https://configured.example")).toBe("https://configured.example");
  expect(normalizeApiOrigin("javascript:alert(1)")).toBe("");
});

test("public browser practice does not probe a desktop service", () => {
  expect(usesDevicePractice("", "english-grammar-automaticity-pwa.vercel.app")).toBe(true);
  expect(usesDevicePractice("", "localhost")).toBe(false);
  expect(usesDevicePractice("", "192.168.178.24")).toBe(false);
  expect(usesDevicePractice("https://api.example.test", "example.test")).toBe(false);
  expect(isLocalAppHost("[::1]")).toBe(true);
  expect(isLocalAppHost("192.168.999.2")).toBe(false);
  expect(isLocalAppHost("172.32.0.1")).toBe(false);
});
