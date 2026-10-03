import { readdir, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

import {
  discussionGuideMaterials,
  driveMaterialCollections,
  errorRepairMaterials,
  grammarTrainingMaterials,
  idiomDailyMaterials,
} from "../packages/content/src/materials";

const projectRoot = resolve(import.meta.dir, "..");
const sourceRoot =
  process.env.GERMAN_SOURCE_ROOT?.trim() || "D:\\APPS_root\\Sources\\German";
const outputFile = resolve(
  projectRoot,
  "apps/web/src/lib/local-material-manifest.json",
);

async function pdfFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return pdfFiles(path);
      return entry.name.toLowerCase().endsWith(".pdf") ? [path] : [];
    }),
  );
  return files.flat();
}

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function exactCandidate(item: { id: string; title: string }, files: string[]) {
  const { id } = item;
  let candidates: string[] = [];

  if (id.startsWith("idiom-day-")) {
    const day = id.match(/(\d+)$/)?.[1];
    if (day) {
      candidates = files.filter(
        (file) =>
          normalize(file).includes(
            "redewendungen sprichworter zitate 24 tage training",
          ) && new RegExp(`^tag ${day}(?!\\d)`).test(normalize(basename(file))),
      );
    }
  } else if (id.startsWith("discussion-guide-")) {
    const number = id.match(/(\d+)$/)?.[1];
    if (number) {
      candidates = files.filter(
        (file) =>
          normalize(file).includes(
            "informationen rund um konversationen und vortrage",
          ) && new RegExp(`^${number} `).test(normalize(basename(file))),
      );
    }
  } else if (id.startsWith("grammar-training-")) {
    const match = id.match(/^grammar-training-(\d+)-(day|bonus)-(\d+)(.*)$/);
    if (match) {
      const [, part, kind, number, suffix] = match;
      const lead = kind === "day" ? `tag ${number}` : `bonustag ${number}`;
      candidates = files.filter(
        (file) =>
          normalize(file).includes(`teil ${part} 30 tage`) &&
          new RegExp(`(?:^| )${lead}(?!\\d)`).test(normalize(basename(file))),
      );

      if (candidates.length > 1 && suffix) {
        const wanted =
          normalize(item.title).split(`tag ${number}`).at(-1)?.trim() || "";
        const tokens = wanted
          .split(" ")
          .filter(
            (token) =>
              token.length > 2 && !["finde", "die", "und"].includes(token),
          );
        const specific = candidates.filter((file) =>
          tokens.every((token) => normalize(basename(file)).includes(token)),
        );
        if (specific.length) candidates = specific;
      }
      if (candidates.length > 1 && !suffix) {
        const exact = candidates.filter((file) =>
          new RegExp(`${lead}$`).test(normalize(basename(file))),
        );
        if (exact.length) candidates = exact;
      }
    }
  } else if (id === "marija-find-errors-b2" || id === "b2-error-training") {
    candidates = files.filter(
      (file) => normalize(basename(file)) === "b2 finde die fehler 2022 neu",
    );
  } else if (id === "begegnungen-a1") {
    candidates = files.filter(
      (file) => normalize(basename(file)) === "begegnungen a1",
    );
  } else if (id === "begegnungen-b1-plus") {
    candidates = files.filter(
      (file) => normalize(basename(file)) === "begegnungen sprachniveau b1",
    );
  } else if (id === "marija-conversation-building-blocks") {
    candidates = files.filter((file) =>
      normalize(basename(file)).startsWith(
        "4 konversationsbausteine deutsch mit marija",
      ),
    );
  }

  return candidates.length === 1 ? candidates[0] : null;
}

const materials = [
  ...idiomDailyMaterials,
  ...discussionGuideMaterials.filter((item) => item.format === "PDF"),
  ...grammarTrainingMaterials.filter((item) => item.format === "PDF"),
  ...errorRepairMaterials,
  ...driveMaterialCollections
    .filter((item) => item.assetSummary.includes("PDF"))
    .map((item) => ({ ...item, format: "PDF" as const })),
];
const files = await pdfFiles(sourceRoot);
const manifest = Object.fromEntries(
  materials.flatMap((item) => {
    const file = exactCandidate(item, files);
    return file
      ? [[item.id, relative(sourceRoot, file).replaceAll("\\", "/")]]
      : [];
  }),
);

await writeFile(outputFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(
  `Mapped ${Object.keys(manifest).length} exact local PDFs to ${outputFile}`,
);
