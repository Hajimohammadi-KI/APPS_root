#!/usr/bin/env node
/**
 * Package the canonical CEFR artifact with one bounded shared-reader width fix.
 *
 * The Data Analytics reader uses a 100vw top bar and draggable-row decoration.
 * On Windows Chromium those elements can extend the document by 8px when a
 * vertical scrollbar is present. This wrapper does not change dashboard data,
 * blocks, sources, tables, charts, or interactions; it only restores the width
 * containment already expected by the official portable browser verifier.
 */

import { randomUUID } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";


export const WIDTH_COMPATIBILITY_STYLE = `<style id="cefr-portable-width-compatibility">
/* Keep shared dashboard chrome inside the scrollbar-adjusted viewport. */
html, body, #data-analytics-portable-reader { max-width: 100%; overflow-x: clip; }
.dashboard-shell { max-width: 100%; overflow-x: clip; }
.analytics-top-bar {
  width: calc(100% + var(--ds-gutter) + var(--ds-gutter));
  margin-right: calc(-1 * var(--ds-gutter));
  margin-left: calc(-1 * var(--ds-gutter));
}
/* Drag affordances may paint outside a row; tables retain their own scroller. */
.analytics-layout-canvas, .analytics-layout-row { min-width: 0; max-width: 100%; overflow-x: clip; }
</style>`;


export function applyWidthCompatibilityCss(html) {
  /** Insert after shared styles so the fix wins without rewriting the reader. */
  if (html.includes('id="cefr-portable-width-compatibility"')) return html;
  if (!html.includes("</head>")) throw new Error("Portable artifact has no closing head element");
  return html.replace("</head>", `${WIDTH_COMPATIBILITY_STYLE}\n</head>`);
}


function parseArguments(values) {
  /** Parse explicit paths; implicit plugin discovery would make builds untraceable. */
  const parsed = {};
  for (let index = 0; index < values.length; index += 2) {
    const flag = values[index];
    const value = values[index + 1];
    if (!flag?.startsWith("--") || !value) throw new Error(`Invalid argument near ${flag ?? "end"}`);
    parsed[flag.slice(2)] = value;
  }
  for (const required of ["input", "output", "plugin-root"]) {
    if (!parsed[required]) throw new Error(`Missing --${required}`);
  }
  return parsed;
}


export async function packageDashboard({ inputPath, outputPath, pluginRoot }) {
  /** Build, patch, extract charts, and run the official exact-payload verifier. */
  const scriptsRoot = join(pluginRoot, "skills", "build-report", "scripts");
  const { buildPortableArtifact } = await import(pathToFileURL(join(scriptsRoot, "build_portable_artifact.mjs")));
  const { extractPortableChartSvgs } = await import(pathToFileURL(join(scriptsRoot, "extract_portable_chart_svgs.mjs")));
  const { verifyPortableArtifact } = await import(pathToFileURL(join(scriptsRoot, "verify_portable_artifact.mjs")));

  const absoluteInput = resolve(inputPath);
  const absoluteOutput = resolve(outputPath);
  const artifact = JSON.parse(readFileSync(absoluteInput, "utf8"));
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  const candidate = `${absoluteOutput}.tmp-${process.pid}-${randomUUID()}.html`;
  try {
    let html = applyWidthCompatibilityCss(buildPortableArtifact(artifact));
    writeFileSync(candidate, html, "utf8");
    if (html.includes('<figure class="portable-content-card portable-chart-summary"')) {
      const staticCharts = await extractPortableChartSvgs({
        htmlPath: candidate,
        readyTimeoutMs: 10_000,
        actionTimeoutMs: 5_000,
      });
      html = applyWidthCompatibilityCss(buildPortableArtifact(artifact, { staticCharts }));
      writeFileSync(candidate, html, "utf8");
    }
    const verification = await verifyPortableArtifact({
      artifactPath: absoluteInput,
      htmlPath: candidate,
      readyTimeoutMs: 10_000,
      actionTimeoutMs: 5_000,
      timeoutMs: 30_000,
    });
    renameSync(candidate, absoluteOutput);
    return {
      ok: true,
      html: absoluteOutput,
      compatibilityFix: "shared-reader-width-containment",
      // Report the durable destination; the verifier necessarily inspected the temporary candidate.
      verification: { ...verification, html: absoluteOutput },
    };
  } catch (error) {
    rmSync(candidate, { force: true });
    throw error;
  }
}


async function main() {
  /** Print one JSON receipt suitable for CI and roadmap evidence. */
  const args = parseArguments(process.argv.slice(2));
  const result = await packageDashboard({
    inputPath: args.input,
    outputPath: args.output,
    pluginRoot: resolve(args["plugin-root"]),
  });
  console.log(JSON.stringify(result));
}


if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message, code: error.code ?? "package_failed" }));
    process.exitCode = 1;
  });
}
