import { createReadStream, type Dirent } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export type QSkillsAssetKind = "audio" | "video" | "document";

export type QSkillsAsset = {
  readonly kind: QSkillsAssetKind;
  readonly label: string;
  readonly path: string;
};

export type QSkillsUnitResources = {
  readonly unit: number;
  readonly assets: readonly QSkillsAsset[];
};

export type QSkillsLevelResources = {
  readonly level: number;
  readonly units: readonly QSkillsUnitResources[];
};

export type QSkillsCatalog = {
  readonly available: boolean;
  readonly levels: readonly QSkillsLevelResources[];
};

const DEFAULT_QSKILLS_ROOT = "D:\\Sources\\English\\QSKill";
const CACHE_MS = 60_000;
let cache: { createdAt: number; catalog: QSkillsCatalog } | undefined;

export function qskillsRoot() {
  return path.resolve(
    /* turbopackIgnore: true */ process.env.QSKILLS_ROOT?.trim() ||
      DEFAULT_QSKILLS_ROOT,
  );
}

function assetKind(filename: string): QSkillsAssetKind | undefined {
  const extension = path.extname(filename).toLowerCase();
  if ([".mp3", ".m4a", ".wav", ".ogg"].includes(extension)) return "audio";
  if ([".mp4", ".webm", ".mov"].includes(extension)) return "video";
  if ([".pdf", ".docx", ".pptx"].includes(extension)) return "document";
  return undefined;
}

function unitFor(relativePath: string) {
  const match =
    /(?:^|[^a-z0-9])(?:unit[-_ ]?|u)0?([1-8])(?:[^a-z0-9]|$)/iu.exec(
      relativePath,
    );
  return match ? Number(match[1]) : undefined;
}

export function formatQSkillsAssetLabel(relativePath: string) {
  const filename = path.basename(relativePath, path.extname(relativePath));
  const activityMatch =
    /(?:^|[_ -])(?:u)?\d{1,2}[_ -](\d{1,2})[_ -](.+)$/iu.exec(filename);
  const activity = activityMatch?.[1];
  const title = (activityMatch?.[2] ?? filename)
    .replace(/([a-z])([A-Z])/gu, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\bQClassroom\b/giu, "Classroom")
    .replace(/\bActivities\s*([A-Z])\s+([A-Z])\b/gu, "Activities $1–$2")
    .replace(/[- ]+/gu, " ")
    .trim();

  // Source filenames contain publisher codes.  Keep the activity number but
  // turn the visible label into a teacher- and learner-readable task name.
  return activity ? `Activity ${activity.padStart(2, "0")} · ${title}` : title;
}

async function filesUnder(directory: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesUnder(item)));
    } else if (entry.isFile()) {
      files.push(item);
    }
  }
  return files;
}

function assetOrder(asset: QSkillsAsset) {
  const kindOrder: Record<QSkillsAssetKind, number> = {
    audio: 0,
    video: 1,
    document: 2,
  };
  return `${kindOrder[asset.kind]}:${asset.label}`;
}

export async function getQSkillsCatalog(): Promise<QSkillsCatalog> {
  if (cache && Date.now() - cache.createdAt < CACHE_MS) return cache.catalog;

  const root = qskillsRoot();
  let entries: Dirent<string>[];
  try {
    entries = await readdir(root, { encoding: "utf8", withFileTypes: true });
  } catch {
    const catalog = { available: false, levels: [] } as const;
    cache = { createdAt: Date.now(), catalog };
    return catalog;
  }

  const levels = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry): Promise<QSkillsLevelResources | undefined> => {
        const match = /(?:^|-)LSLevel-(\d+)$/iu.exec(entry.name);
        if (!match) return undefined;
        const level = Number(match[1]);
        const levelRoot = path.join(root, entry.name);
        const assetsByUnit = new Map<number, QSkillsAsset[]>();
        for (const file of await filesUnder(levelRoot)) {
          const relativePath = path.relative(root, file);
          const kind = assetKind(file);
          const unit = unitFor(relativePath);
          if (!kind || !unit) continue;
          const assets = assetsByUnit.get(unit) ?? [];
          assets.push({
            kind,
            label: formatQSkillsAssetLabel(relativePath),
            path: relativePath,
          });
          assetsByUnit.set(unit, assets);
        }
        return {
          level,
          units: [...assetsByUnit.entries()]
            .sort(([first], [second]) => first - second)
            .map(([unit, assets]) => ({
              unit,
              assets: assets.sort((first, second) =>
                assetOrder(first).localeCompare(assetOrder(second)),
              ),
            })),
        };
      }),
  );

  const catalog = {
    available: true,
    levels: levels
      .filter((level): level is QSkillsLevelResources => Boolean(level))
      .sort((first, second) => first.level - second.level),
  } satisfies QSkillsCatalog;
  cache = { createdAt: Date.now(), catalog };
  return catalog;
}

export async function resolveQSkillsResource(relativePath: string) {
  const root = qskillsRoot();
  const resolved = path.resolve(/* turbopackIgnore: true */ root, relativePath);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`))
    return undefined;
  try {
    const info = await stat(resolved);
    return info.isFile() ? resolved : undefined;
  } catch {
    return undefined;
  }
}

export function qskillsResourceStream(filePath: string) {
  return Readable.toWeb(
    createReadStream(filePath),
  ) as unknown as ReadableStream;
}

export function qskillsContentType(filePath: string) {
  const contentTypes: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };
  return (
    contentTypes[path.extname(filePath).toLowerCase()] ??
    "application/octet-stream"
  );
}
