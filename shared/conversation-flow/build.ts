import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function syncConversationFlow(
  appRoot: string,
  language: "en" | "de",
) {
  const app = language === "de" ? "apps/web/src/app" : "apps/web/app";
  const destination = resolve(appRoot, app, "studio/source/flow");
  await mkdir(destination, { recursive: true });
  // Copy the shared implementation into each package so standalone installers resolve React locally.
  for (const name of [
    "model.ts",
    "daily-exercise.ts",
    "daily-model.tsx",
    "storage.ts",
    "recorder.ts",
    "copy.ts",
    "hints.ts",
    "playback-rate.ts",
    "playback.tsx",
    "library.tsx",
    "studio.tsx",
    "styles.css",
  ]) {
    await copyFile(resolve(import.meta.dir, name), resolve(destination, name));
  }
  await copyFile(
    resolve(import.meta.dir, "editorial.css"),
    resolve(appRoot, app, "styles/101-editorial.css"),
  );
  await copyFile(
    resolve(import.meta.dir, "editorial.css"),
    resolve(appRoot, "apps/web/public/editorial.css"),
  );
  const htmlFiles = [
    `replacements/${language}/${language === "de" ? "grammatik" : "grammar"}.html`,
    `replacements/${language}/${language === "de" ? "heute" : "daily"}.html`,
    `learning-core/practice-${language}.html`,
  ];
  for (const relative of htmlFiles) {
    const file = resolve(appRoot, "apps/web/public", relative);
    const html = await readFile(file, "utf8");
    if (!html.includes('href="/editorial.css"'))
      await writeFile(
        file,
        html.replace(
          "</head>",
          '<link rel="stylesheet" href="/editorial.css">\n</head>',
        ),
      );
  }
}
