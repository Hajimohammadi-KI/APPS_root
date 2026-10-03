import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { sha256 } from "./lib/automaticity-release-reviews";
import { createContentReviewPacket } from "./lib/curriculum-review-packets";
import { activePracticeTasks } from "../shared/learning-core/src/automaticity/curriculum";
import type { CurriculumPack } from "../shared/learning-core/src/automaticity/curriculum";
const root = resolve(import.meta.dir, ".."),
  id = Bun.argv[2];
if (!id || (id !== "--all" && !/^(en|de)\.c\.\d+$/.test(id)))
  throw new Error(
    "Usage: bun scripts/prepare-automaticity-content-review.ts en.c.001 [NEW-output.json] | --all [NEW-directory]",
  );
const loadPack = async (language: string) => {
  const app =
    language === "en"
      ? "Apps/English/English-Automaticity"
      : "Apps/Deutsch/Deutsch-Automaticity";
  return JSON.parse(
    await readFile(
      resolve(
        root,
        app,
        `apps/web/public/learning-core/curriculum-${language}.json`,
      ),
      "utf8",
    ),
  ) as CurriculumPack;
};
if (id !== "--all") {
  const pack = await loadPack(id.slice(0, 2));
  const unit = pack.units.find((unit) => unit.id === id);
  if (!unit) throw new Error(`Unknown construction ${id}`);
  const target = resolve(
    root,
    Bun.argv[3] ??
      `artifacts/content-review-packets/${id}-${pack.version}.json`,
  );
  await mkdir(dirname(target), { recursive: true });
  await writeFile(
    target,
    JSON.stringify(createContentReviewPacket(pack, unit), null, 2) + "\n",
    { flag: "wx" },
  );
  console.log(target);
} else {
  const target = resolve(
    root,
    Bun.argv[3] ??
      `artifacts/content-review-packets/all-${new Date().toISOString().replace(/[:.]/g, "-")}`,
  );
  await mkdir(dirname(target), { recursive: true });
  // Creating a new directory exclusively prevents regeneration over reviewer work.
  await mkdir(target);
  const packets = [];
  for (const language of ["en", "de"]) {
    const pack = await loadPack(language);
    for (const unit of pack.units) {
      const packet = createContentReviewPacket(pack, unit),
        path = `${unit.id}.json`;
      const bytes = JSON.stringify(packet, null, 2) + "\n";
      await writeFile(resolve(target, path), bytes, { flag: "wx" });
      packets.push({
        language,
        constructionId: unit.id,
        title: unit.title,
        familyIds: unit.familyIds,
        contentVersion: pack.version,
        mappingVersion: pack.mappingVersion,
        path,
        sha256: sha256(bytes),
        cells: packet.reviewDrafts.length,
        tasks: activePracticeTasks(unit).length,
        archivedTasks: unit.retiredTasks?.length ?? 0,
      });
    }
  }
  const manifest = {
    schemaVersion: 2,
    createdAt: new Date().toISOString(),
    status: "awaiting_actual_human_review",
    packets,
  };
  await writeFile(
    resolve(target, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { flag: "wx" },
  );
  const escape = (value: string) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[character]!,
    );
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Grammar content review</title><style>body{font:16px/1.55 system-ui;margin:0;background:#f5f6f0;color:#203c33}main{max-width:960px;margin:auto;padding:32px}h1{line-height:1.2}input{box-sizing:border-box;width:100%;padding:12px;border:1px solid #a5b6ab;border-radius:6px}article{border:1px solid #d3dfd5;border-radius:8px;background:white;margin:12px 0;padding:16px}h3{margin:0}a{color:#085c48}small{color:#52615a}.pending{color:#875104}label{font-weight:600}details{margin:16px 0}summary{cursor:pointer}ul{padding-left:24px}</style><main><h1>Grammar content review</h1><p>${packets.length} constructions · ${packets.reduce((n, row) => n + row.cells, 0)} required cells · ${packets.reduce((n, row) => n + row.tasks, 0)} tasks</p><p class="pending">All packets await actual human review. Creating a packet does not approve its content.</p><details><summary>How to review</summary><ol><li>Open the construction packet. Read its examples, sources and tasks.</li><li>Complete the content review and task judgments, recording specific findings. Keep unresolved checks open.</li><li>Save your completed evidence separately. Follow the packet instructions to record its identity, date and file hash.</li><li>Review the assessment procedure for every task. Changes to content require a fresh review.</li></ol></details><label for="search">Find a construction, language or grammar family</label><input id="search" type="search" placeholder="For example: German, G08 or en.c.001"><p id="count" role="status">${packets.length} constructions</p>${packets.map((row) => `<article data-search="${escape([row.language === "en" ? "English" : "German", row.constructionId, row.title, ...row.familyIds].join(" ").toLowerCase())}"><h3><a href="${escape(row.path)}" download>${escape(row.title)}</a></h3><small>${escape(row.constructionId)} · ${escape(row.familyIds.join(", "))} · ${row.cells} cells · ${row.tasks} tasks</small><div class="pending">Review pending</div></article>`).join("")}<script>const search=document.getElementById('search');search.addEventListener('input',()=>{let visible=0;for(const row of document.querySelectorAll('article')){row.hidden=!row.dataset.search.includes(search.value.trim().toLowerCase());if(!row.hidden)visible++;}document.getElementById('count').textContent=visible+' constructions';});</script></main></html>`;
  await writeFile(resolve(target, "index.html"), html, { flag: "wx" });
  console.log(
    JSON.stringify({
      target,
      packets: packets.length,
      cells: packets.reduce((n, row) => n + row.cells, 0),
      tasks: packets.reduce((n, row) => n + row.tasks, 0),
    }),
  );
}
