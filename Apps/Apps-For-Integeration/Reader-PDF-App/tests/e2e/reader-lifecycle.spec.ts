import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const fixture = resolve("tests/fixtures/reader-smoke.pdf");
const importRoot = resolve(process.env.READER_IMPORT_ROOT ?? "tests/.runtime-imports");
const expectedVersion = process.env.READER_EXPECTED_VERSION ?? "browser-test";

test.afterAll(async () => {
  if (!process.env.READER_IMPORT_ROOT) {
    await rm(importRoot, { recursive: true, force: true });
  }
});

test("opens, renders, selects, highlights, annotates, saves, and reopens a real PDF", async ({ page, request }) => {
  const fixtureBytes = await readFile(fixture);
  const documentId = createHash("sha256").update(fixtureBytes).digest("hex");
  await mkdir(importRoot, { recursive: true });
  await copyFile(fixture, resolve(importRoot, `${documentId}.pdf`));

  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({
    service: "research-pdf-studio",
    ready: true,
    contractVersion: 1,
    version: expectedVersion,
    storageBoundary: "browser-local",
    localPdfImport: "loopback-only",
  });

  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(`/?localPdf=${documentId}&name=reader-smoke.pdf`);
  await expect(page.locator(".pdf-page")).toHaveCount(1);
  await expect(page.locator(".textLayer")).toContainText("Automaticity grows through accurate retrieval");
  const canvas = page.locator(".pdf-page canvas");
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => ({ width: element.width, height: element.height })))
    .toMatchObject({ width: expect.any(Number), height: expect.any(Number) });
  expect(await canvas.evaluate((element: HTMLCanvasElement) => element.width > 500 && element.height > 700)).toBe(true);

  const selectText = async () => {
    const selected = await page.evaluate(() => {
      const layer = document.querySelector(".textLayer");
      const documentRoot = document.querySelector(".pdf-document");
      if (!layer || !documentRoot) return false;
      const range = document.createRange();
      range.selectNodeContents(layer);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      documentRoot.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      return Boolean(selection?.toString().includes("Automaticity grows"));
    });
    expect(selected).toBe(true);
    await expect(page.getByRole("menu", { name: "Aktionen für ausgewählten Text" })).toBeVisible();
  };

  await selectText();
  await page.getByRole("button", { name: "Wichtig markieren" }).click();
  const firstOverlayCount = await page.locator(".pdf-mark-overlay.highlight").count();
  expect(firstOverlayCount).toBeGreaterThan(0);

  await selectText();
  await page.getByRole("button", { name: /Kommentar$/ }).click();
  await page.locator("#selection-comment").fill("Remember this automaticity evidence.");
  await page.getByRole("button", { name: "Kommentar speichern" }).click();
  await expect.poll(() => page.locator(".pdf-mark-overlay").count()).toBeGreaterThan(firstOverlayCount);

  await page.getByRole("button", { name: /Markierungen/ }).click();
  await expect(page.locator(".note-card")).toHaveCount(2);
  await expect(page.locator(".note-card").filter({ hasText: "Remember this automaticity evidence." })).toBeVisible();

  await page.getByRole("button", { name: "Einstellungen", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Markierungen (.json)" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(exported.marks).toHaveLength(2);
  expect(exported.marks.some((mark: { note?: string }) => mark.note === "Remember this automaticity evidence.")).toBe(true);

  await page.reload();
  await expect(page.locator(".textLayer")).toContainText("Automaticity grows through accurate retrieval");
  await expect.poll(() => page.locator(".pdf-mark-overlay").count()).toBeGreaterThan(firstOverlayCount);
  await page.getByRole("button", { name: /Markierungen/ }).click();
  await expect(page.locator(".note-card")).toHaveCount(2);
  await expect(page.locator(".note-card").filter({ hasText: "Remember this automaticity evidence." })).toBeVisible();
  expect(errors).toEqual([]);
});

test("keeps the Reader usable at an 800 by 1280 tablet viewport", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 1280 });
  await page.goto("/");
  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    fileInputs: document.querySelectorAll('input[type="file"][accept*="pdf"]').length,
  }));
  expect(layout.fileInputs).toBeGreaterThan(0);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
});

test("keeps PDF failure visible and recovers through another file", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type="file"][accept*="pdf"]').first().setInputFiles({
    buffer: Buffer.from("not a pdf"),
    mimeType: "application/pdf",
    name: "broken.pdf",
  });

  const recovery = page.getByRole("alert");
  await expect(recovery).toContainText("keine gültige PDF");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Andere PDF auswählen" }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(fixture);

  await expect(recovery).toBeHidden();
  await expect(page.locator(".pdf-page")).toHaveCount(1);
});
