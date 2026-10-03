import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { GrammarWorksheet } from "./model";

export async function emitDailyContext(
  root: string,
  language: "de" | "en",
  worksheets: readonly GrammarWorksheet[],
) {
  const base = resolve(root, "apps/web/public/replacements", language);
  await writeFile(
    resolve(base, "daily-worksheets.json"),
    JSON.stringify({ worksheets }),
  );
  const page = resolve(base, language === "de" ? "heute.html" : "daily.html");
  let html = await readFile(page, "utf8");
  const byLevel = Object.fromEntries(
    [...new Set(worksheets.map((w) => w.level))].map((level) => {
      const worksheet = worksheets.find((w) => w.level === level)!;
      return [level, { topic: worksheet.topic, id: worksheet.id }];
    }),
  );
  // Keep the existing dashboard. Only its context and exercise destinations change.
  const mapping = `<script data-daily-worksheet-map>window.dailyWorksheetsByLevel=${JSON.stringify(byLevel)};</script>`;
  html = html.replace(
    /<script data-daily-worksheet-map>[\s\S]*?<\/script>\s*/,
    "",
  );
  html = html.replace("</head>", `${mapping}\n</head>`);
  html = html.replace(
    /const focusByLevel=\{[^\n]+\};/g,
    "const focusByLevel=Object.fromEntries(Object.entries(window.dailyWorksheetsByLevel).map(([level,item])=>[level,item.topic]));",
  );
  const grammar = language === "de" ? "/grammatik" : "/grammar";
  html = html.replace(
    /const routes=\[[^\n]+\];/,
    `const routes=${JSON.stringify([grammar, "/studio", "/studio", grammar, grammar, "/studio", grammar])};`,
  );
  html = html.replace(
    /level,topic,(?:worksheet:[^,]+,)?return:/,
    "level,topic,worksheet:window.dailyWorksheetsByLevel[level].id,return:",
  );
  if (!html.includes("worksheet:window.dailyWorksheetsByLevel[level].id"))
    throw new Error("Daily exercise link context was not found.");
  await writeFile(page, html);
}
