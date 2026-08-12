import { describe, expect, test } from "bun:test";
import {
  MAX_PDF_BYTES,
  isPrivateIpv4,
  isPrivateIpv6,
  parseIpv4,
  readCapped,
  safeRemotePdfUrl,
} from "../lib/safe-remote-url";

function rejects(value: string, reason: "invalid-url" | "private-url") {
  expect(() => safeRemotePdfUrl(value)).toThrow(reason);
}

describe("safeRemotePdfUrl", () => {
  test("accepts an ordinary public https PDF", () => {
    expect(safeRemotePdfUrl("https://example.org/paper.pdf").hostname).toBe("example.org");
  });

  test("rejects non-https and embedded credentials", () => {
    rejects("http://example.org/paper.pdf", "invalid-url");
    rejects("https://user:pass@example.org/paper.pdf", "invalid-url");
    rejects("ftp://example.org/paper.pdf", "invalid-url");
  });

  test("rejects loopback in every notation", () => {
    rejects("https://localhost/x.pdf", "private-url");
    rejects("https://127.0.0.1/x.pdf", "private-url");
    rejects("https://127.1.2.3/x.pdf", "private-url");
    // Bare-integer host: the previous text blocklist let this through.
    rejects("https://2130706433/x.pdf", "private-url");
  });

  test("rejects IPv6 loopback and local ranges", () => {
    // `url.hostname` keeps the brackets, which the old `::1` pattern missed.
    rejects("https://[::1]/x.pdf", "private-url");
    rejects("https://[::]/x.pdf", "private-url");
    rejects("https://[::ffff:127.0.0.1]/x.pdf", "private-url");
    rejects("https://[fd00::1]/x.pdf", "private-url");
    rejects("https://[fe80::1]/x.pdf", "private-url");
  });

  test("rejects private, link-local and metadata ranges", () => {
    rejects("https://10.0.0.5/x.pdf", "private-url");
    rejects("https://192.168.1.1/x.pdf", "private-url");
    rejects("https://172.16.0.1/x.pdf", "private-url");
    rejects("https://172.31.255.254/x.pdf", "private-url");
    rejects("https://169.254.169.254/x.pdf", "private-url");
    rejects("https://100.64.0.1/x.pdf", "private-url");
    rejects("https://0.0.0.0/x.pdf", "private-url");
  });

  test("rejects internal-only host suffixes", () => {
    rejects("https://printer.local/x.pdf", "private-url");
    rejects("https://db.internal/x.pdf", "private-url");
    rejects("https://nas.home.arpa/x.pdf", "private-url");
    rejects("https://app.localhost/x.pdf", "private-url");
  });

  test("keeps public addresses adjacent to blocked ranges usable", () => {
    expect(safeRemotePdfUrl("https://172.32.0.1/x.pdf").hostname).toBe("172.32.0.1");
    expect(safeRemotePdfUrl("https://11.0.0.1/x.pdf").hostname).toBe("11.0.0.1");
    expect(safeRemotePdfUrl("https://8.8.8.8/x.pdf").hostname).toBe("8.8.8.8");
  });

  test("allows the tracker's own material server only when opted in", () => {
    const material = "http://127.0.0.1:3199/api/materials/a.pdf";
    expect(safeRemotePdfUrl(material, { allowLocalMaterial: true }).port).toBe("3199");
    rejects(material, "invalid-url");
    // A different port or path on the same host stays blocked.
    expect(() => safeRemotePdfUrl("http://127.0.0.1:3200/api/materials/a.pdf", { allowLocalMaterial: true })).toThrow();
    expect(() => safeRemotePdfUrl("http://127.0.0.1:3199/admin", { allowLocalMaterial: true })).toThrow();
  });
});

describe("parseIpv4", () => {
  test("reads dotted quads and bare integers", () => {
    expect(parseIpv4("127.0.0.1")).toEqual([127, 0, 0, 1]);
    expect(parseIpv4("2130706433")).toEqual([127, 0, 0, 1]);
    expect(parseIpv4("example.org")).toBeNull();
    expect(parseIpv4("999.1.1.1")).toBeNull();
    expect(parseIpv4("4294967296")).toBeNull();
  });

  test("classifies ranges", () => {
    expect(isPrivateIpv4([127, 0, 0, 1])).toBe(true);
    expect(isPrivateIpv4([8, 8, 8, 8])).toBe(false);
    expect(isPrivateIpv6("[::1]")).toBe(true);
    expect(isPrivateIpv6("[2606:4700::1]")).toBe(false);
  });
});

describe("readCapped", () => {
  function streamOf(chunks: Uint8Array[]) {
    return new Response(
      new ReadableStream({
        start(controller) {
          for (const chunk of chunks) controller.enqueue(chunk);
          controller.close();
        },
      }),
    );
  }

  test("returns the joined body when under the cap", async () => {
    const bytes = await readCapped(streamOf([new Uint8Array([1, 2]), new Uint8Array([3])]));
    expect(bytes && Array.from(bytes)).toEqual([1, 2, 3]);
  });

  test("returns null instead of buffering past the cap", async () => {
    const oversized = [new Uint8Array(MAX_PDF_BYTES), new Uint8Array(1024)];
    expect(await readCapped(streamOf(oversized))).toBeNull();
  });

  test("treats a bodyless response as empty", async () => {
    expect((await readCapped(new Response(null)))?.byteLength).toBe(0);
  });
});
