import { expect, test } from "bun:test";
import { normalizeApiOrigin } from "../../Apps/English/English-Automaticity/apps/web/lib/api-origin";
import english from "../../Apps/English/English-Automaticity/apps/web/next.config.mjs";
import german from "../../Apps/Deutsch-Automaticity/apps/web/next.config";
import { acceptsRequest, isPrivateAddress } from "./gateway.mjs";

test("old desktop API settings migrate while custom endpoints survive", () => {
  for (const value of [
    undefined,
    "",
    "http://localhost:4201/",
    "http://127.0.0.1:4201",
  ])
    expect(normalizeApiOrigin(value)).toBe("");
  expect(normalizeApiOrigin(" https://api.example.test/ ")).toBe(
    "https://api.example.test",
  );
  expect(
    normalizeApiOrigin("http://localhost:4201", "https://configured.example"),
  ).toBe("https://configured.example");
});

test("same-origin API routes preserve web handlers and point to host backends", async () => {
  expect((await english.rewrites()).afterFiles).toEqual([
    { source: "/api/health", destination: "http://127.0.0.1:4201/api/health" },
    {
      source: "/api/assessment",
      destination: "http://127.0.0.1:4201/api/assessment",
    },
  ]);
  const rewrites = await german.rewrites!();
  expect(rewrites).toHaveProperty("afterFiles", [
    {
      source: "/api/v1/:path*",
      destination: "http://127.0.0.1:4210/api/v1/:path*",
    },
  ]);
});

test("gateway restricts clients, Host headers and cross-site writes", () => {
  for (const ip of [
    "127.0.0.1",
    "::1",
    "::ffff:192.168.178.2",
    "172.31.1.4",
    "10.0.0.2",
  ])
    expect(isPrivateAddress(ip)).toBe(true);
  for (const ip of ["8.8.8.8", "172.32.0.1", "192.168.999.1", "example.test"])
    expect(isPrivateAddress(ip)).toBe(false);
  const request = {
    socket: { remoteAddress: "192.168.178.10" },
    method: "POST",
    headers: {
      host: "192.168.178.24:3203",
      origin: "http://192.168.178.24:3203",
    },
  };
  expect(acceptsRequest(request, "192.168.178.24", 3203)).toBe(true);
  expect(
    acceptsRequest(
      {
        ...request,
        headers: { ...request.headers, origin: "https://external.example" },
      },
      "192.168.178.24",
      3203,
    ),
  ).toBe(false);
  expect(
    acceptsRequest(
      { ...request, headers: { host: "external.example:3203" } },
      "192.168.178.24",
      3203,
    ),
  ).toBe(false);
});
