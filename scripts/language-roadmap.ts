import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export const root = resolve(import.meta.dir, "..");
const defaults = {
  backlog: resolve(
    root,
    "docs/language-automaticity-implementation-backlog.json",
  ),
  history: resolve(root, "docs/language-automaticity-roadmap-history.json"),
  output: resolve(root, "docs/LANGUAGE-AUTOMATICITY-ROADMAP.html"),
};
export interface Task {
  id: string;
  phase: string;
  title: string;
  status: string;
  priority: string;
  required: boolean;
  progressNote: string;
  acceptance: string[];
  evidence: string[];
  dependsOn: string[];
  deliverable: string;
  condition: string | null;
  updatedOn?: string;
  engineeringVerification?: string;
  remainingHumanWork?: string[];
  remainingEngineeringWork?: string[];
  afterHumanValidation?: string[];
  engineeringScope?: string;
}
export interface Backlog {
  schemaVersion: number;
  scope: string;
  updatedOn: string;
  progressRecord: string;
  phases: { id: string; title: string; exit: string }[];
  tasks: Task[];
  technicalRelease: {
    status: string;
    versions: Record<string, string>;
    installedVersions?: Record<string, string>;
    blocker?: string;
    fullCurriculum: string;
    learnerOutcomes: string;
    report: string;
  };
}
interface Change {
  id: string;
  at: string;
  taskId: string;
  title: string;
  from: string | null;
  to: string;
  note: string;
  engineeringVerified: boolean;
  evidence: string[];
}
interface History {
  version: 1;
  firstObservedAt: string;
  updatedAt: string;
  sourceSha256: string;
  taskSnapshots: Record<string, Task>;
  changes: Change[];
}
export interface Snapshot {
  backlog: Backlog;
  history: History;
  generatedAt: string;
  sourceSha256: string;
}
const states = new Set([
  "planned",
  "in_progress",
  "implemented",
  "verified",
  "blocked",
  "deferred",
]);
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

export function parseBacklog(raw: string): Backlog {
  const value = JSON.parse(raw) as Backlog;
  if (
    value.schemaVersion !== 1 ||
    !Array.isArray(value.tasks) ||
    !Array.isArray(value.phases) ||
    !value.technicalRelease
  )
    throw new Error("Unsupported roadmap backlog");
  const ids = new Set<string>(),
    phases = new Set(value.phases.map((p) => p.id));
  for (const task of value.tasks) {
    if (
      !task.id ||
      ids.has(task.id) ||
      !phases.has(task.phase) ||
      !states.has(task.status) ||
      !Array.isArray(task.acceptance) ||
      !Array.isArray(task.evidence) ||
      !Array.isArray(task.dependsOn) ||
      typeof task.required !== "boolean" ||
      typeof task.title !== "string" ||
      typeof task.progressNote !== "string"
    )
      throw new Error(`Invalid roadmap task: ${task.id}`);
    if (
      task.remainingHumanWork !== undefined &&
      (!Array.isArray(task.remainingHumanWork) ||
        task.remainingHumanWork.some(
          (item) => typeof item !== "string" || !item.trim(),
        ) ||
        (task.status === "verified" && task.remainingHumanWork.length))
    )
      throw new Error(`Invalid remaining human work: ${task.id}`);
    for (const field of [
      "remainingEngineeringWork",
      "afterHumanValidation",
    ] as const) {
      const work = task[field];
      if (
        work !== undefined &&
        (!Array.isArray(work) ||
          work.some((item) => typeof item !== "string" || !item.trim()) ||
          (task.status === "verified" && work.length))
      )
        throw new Error(`Invalid remaining work (${field}): ${task.id}`);
    }
    if (
      task.engineeringScope !== undefined &&
      (typeof task.engineeringScope !== "string" ||
        !task.engineeringScope.trim())
    )
      throw new Error(`Invalid engineering scope: ${task.id}`);
    if (
      (task.status === "verified" ||
        task.engineeringVerification === "verified_for_recorded_scope") &&
      !task.evidence.length
    )
      throw new Error(`Verified task needs evidence: ${task.id}`);
    ids.add(task.id);
  }
  for (const task of value.tasks)
    for (const id of task.dependsOn)
      if (!ids.has(id) || id === task.id)
        throw new Error(`Invalid dependency: ${task.id} -> ${id}`);
  return value;
}

export function advanceHistory(
  backlog: Backlog,
  sourceSha256: string,
  previous: History | null,
  at: string,
): History {
  const taskSnapshots = Object.fromEntries(
    backlog.tasks.map((task) => [task.id, task]),
  );
  if (!previous)
    return {
      version: 1,
      firstObservedAt: at,
      updatedAt: at,
      sourceSha256,
      taskSnapshots,
      changes: [],
    };
  if (
    previous.version !== 1 ||
    !Array.isArray(previous.changes) ||
    !previous.taskSnapshots
  )
    throw new Error("Unreadable roadmap history; original retained");
  const changes = [...previous.changes];
  for (const task of backlog.tasks) {
    const before = previous.taskSnapshots[task.id];
    if (same(before, task)) continue;
    changes.push({
      id: hash(JSON.stringify([at, task])),
      at,
      taskId: task.id,
      title: task.title,
      from: before?.status ?? null,
      to: task.status,
      note: task.progressNote,
      engineeringVerified:
        task.engineeringVerification === "verified_for_recorded_scope",
      evidence: task.evidence,
    });
  }
  for (const task of Object.values(previous.taskSnapshots))
    if (!taskSnapshots[task.id])
      changes.push({
        id: hash(JSON.stringify([at, "removed", task])),
        at,
        taskId: task.id,
        title: task.title,
        from: task.status,
        to: "removed",
        note: "Removed from the current backlog; previous evidence retained in this journal.",
        engineeringVerified: false,
        evidence: task.evidence,
      });
  return {
    ...previous,
    updatedAt: previous.sourceSha256 === sourceSha256 ? previous.updatedAt : at,
    sourceSha256,
    taskSnapshots,
    changes,
  };
}

async function atomicWrite(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.${process.pid}.tmp`;
  await writeFile(temp, content, "utf8");
  await rename(temp, path);
}

export async function buildRoadmap(
  paths = defaults,
  check = false,
): Promise<Snapshot> {
  const raw = await readFile(paths.backlog, "utf8"),
    backlog = parseBacklog(raw),
    sourceSha256 = hash(raw);
  let previous: History | null = null;
  try {
    previous = JSON.parse(await readFile(paths.history, "utf8")) as History;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const history = advanceHistory(
    backlog,
    sourceSha256,
    previous,
    new Date().toISOString(),
  );
  const generatedAt = history.updatedAt;
  const snapshot: Snapshot = { backlog, history, generatedAt, sourceSha256 };
  const template = await readFile(
    resolve(root, "scripts/roadmap/template.html"),
    "utf8",
  );
  const client = await readFile(
    resolve(root, "scripts/roadmap/client.js"),
    "utf8",
  );
  // Embedded JSON must not be able to close its script element.
  const data = JSON.stringify(snapshot)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const html = template
    .replace("/* ROADMAP_DATA */", () => data)
    .replace("/* ROADMAP_CLIENT */", () => client);
  if (check) {
    if (
      !same(previous, history) ||
      (await readFile(paths.output, "utf8")) !== html
    )
      throw new Error("Roadmap is stale. Run: bun scripts/language-roadmap.ts");
  } else {
    if (!same(previous, history))
      await atomicWrite(paths.history, JSON.stringify(history, null, 2) + "\n");
    let existing = "";
    try {
      existing = await readFile(paths.output, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (existing !== html) await atomicWrite(paths.output, html);
  }
  return snapshot;
}

export async function serveRoadmap(paths = defaults, port = 3317) {
  let current = await buildRoadmap(paths),
    errorMessage = "",
    refreshing = false;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      const headers = {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      };
      if (request.method !== "GET")
        return new Response("Read-only roadmap", { status: 405, headers });
      if (path === "/snapshot")
        return Response.json(
          { ...current, refreshError: errorMessage },
          { headers },
        );
      if (path === "/" || path === "/LANGUAGE-AUTOMATICITY-ROADMAP.html")
        return new Response(Bun.file(paths.output), {
          headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
        });
      // This local viewer never serves arbitrary workspace or learner files.
      return new Response("Not found", { status: 404, headers });
    },
  });
  const timer = setInterval(async () => {
    if (refreshing) return;
    refreshing = true;
    try {
      current = await buildRoadmap(paths);
      errorMessage = "";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
    } finally {
      refreshing = false;
    }
  }, 1500);
  return {
    server,
    stop() {
      clearInterval(timer);
      server.stop(true);
    },
  };
}

if (import.meta.main) {
  const snapshot = await buildRoadmap(defaults, Bun.argv.includes("--check"));
  console.log(
    `Roadmap: ${defaults.output} (${snapshot.backlog.tasks.length} tasks)`,
  );
  if (Bun.argv.includes("--serve")) {
    const { server, stop } = await serveRoadmap(
      defaults,
      Number(
        Bun.argv.find((arg) => arg.startsWith("--port="))?.slice(7) ?? 3317,
      ),
    );
    for (const signal of ["SIGINT", "SIGTERM"] as const)
      process.on(signal, () => {
        stop();
        process.exit();
      });
    console.log(`Live roadmap: http://127.0.0.1:${server.port}`);
  }
}
