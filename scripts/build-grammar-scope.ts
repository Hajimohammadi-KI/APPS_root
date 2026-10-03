import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildScope,
  SCOPE_OUTPUT,
  PACK_PATHS,
} from "./lib/grammar-scope-files";
import { lesson } from "./lib/grammar-scope";
import type { CurriculumPack } from "../shared/learning-core/src/automaticity/curriculum";

const root = resolve(import.meta.dir, "..");
if (Bun.argv.includes("--init-baseline")) {
  const packs = await Promise.all(
    PACK_PATHS.map(
      async (path) =>
        JSON.parse(
          await readFile(resolve(root, path), "utf8"),
        ) as CurriculumPack,
    ),
  );
  await mkdir(resolve(root, "docs/grammar-scope"), { recursive: true });
  await writeFile(
    resolve(root, "docs/grammar-scope/baseline-lessons.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        capturedOn: "2026-09-05",
        note: "Migration minimum. Preserve IDs, original titles within aliases and content history. Additions do not replace these lessons; explicit source changes require regenerated mapping evidence.",
        lessons: packs.flatMap((pack) => pack.units.map(lesson)),
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
}
const scope = await buildScope(root);
const data = JSON.stringify({
  inventory: scope.inventory,
  crosswalk: scope.crosswalk,
  references: scope.references,
  cells: scope.cells.map(({ constructionId, status, required }) => ({
    constructionId,
    status,
    required,
  })),
}).replace(/</g, "\\u003c");
const html = `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Phase 4 · Grammar scope</title>
<style>
:root{font:16px/1.6 system-ui;color:#203b31;background:#f5f6ef}*{box-sizing:border-box}body{margin:0}main{max-width:1120px;margin:auto;padding:36px 24px}h1{font-size:clamp(2rem,5vw,3.3rem);line-height:1.12;max-width:800px}h2{font-size:1.15rem}a{color:#076574}p{max-width:85ch}.eyebrow{font-size:.8rem;text-transform:uppercase;letter-spacing:.1em}.banner,details{background:white;border:1px solid #ccd5ca;border-radius:12px;padding:18px;margin:14px 0}.banner{background:#eaf4ec}.note{color:#77520e;background:#fff5df;padding:12px;border-radius:8px}.filters{display:flex;flex-wrap:wrap;gap:12px;position:sticky;top:0;background:#f5f6ef;padding:12px 0;z-index:1}label{display:grid;gap:4px;min-width:145px}input,select{font:inherit;padding:9px;border:1px solid #adbeb3;border-radius:6px;max-width:100%}input{min-width:240px}summary{cursor:pointer;font-weight:650}small{display:block;color:#57675f}.tag{display:inline-block;font-size:.8rem;padding:2px 8px;border-radius:20px;background:#eef1ec;margin-right:6px}.gap{border-left:4px solid #b97619}dl{display:grid;grid-template-columns:140px 1fr;gap:10px;margin-top:18px}dt{font-weight:650}dd{margin:0;overflow-wrap:anywhere}ul{padding-left:22px}.empty{padding:20px}footer{margin:30px 0}button{font:inherit;cursor:pointer;padding:9px;border:1px solid #adbeb3;border-radius:6px;background:white}#count{font-weight:600}@media(max-width:600px){main{padding:22px 14px}.filters{position:static}label,input,select{width:100%;min-width:0}dl{grid-template-columns:1fr;gap:4px}dd{margin-bottom:10px}}</style>
<main><div class="eyebrow">Phase 04 · English + German</div><h1>See what each grammar target means.</h1><p>Form, meaning, use, contrasts and acceptable alternatives for every existing unit, with explicit targets for missing coverage.</p>
<div class="banner"><strong>${scope.summary.existingConstructions} existing units · ${scope.summary.additionalTargets} additional targets · ${scope.summary.familyAudits} language/family audits</strong><p>${scope.summary.requiredCells} required stage/mode cells; ${scope.summary.missingTaskCells} still need tasks. ${scope.summary.notApplicableCells} spoken cells are N/A because their targets concern written spelling.</p></div>
<p class="note">These specifications were authored by Codex. Independent human content review is pending. Mapping a target does not certify its exercises, evaluator, CEFR level or learning effect.</p>
<p><a href="LANGUAGE-AUTOMATICITY-ROADMAP.html">Main roadmap</a> · <a href="grammar-scope/inventory.json">Full inventory and coverage data</a> · <a href="grammar-scope/missing-work.json">Missing-work list</a></p>
<div class="filters"><label>Search<input id="search" type="search" placeholder="Try valency, passive, en.c.113"></label><label>Language<select id="language"><option value="all">Both languages</option><option value="en">English</option><option value="de">German</option></select></label><label>Scope<select id="kind"><option value="all">All targets</option><option value="existing_unit">Existing units</option><option value="additional_target">Additional targets</option><option value="missing_target">Unimplemented targets</option></select></label><label>Family<select id="family"><option value="all">All families</option>${Array.from({ length: 21 }, (_, i) => `<option>G${String(i + 1).padStart(2, "0")}</option>`).join("")}</select></label></div>
<p id="count" role="status" aria-live="polite"></p><section id="inventory"></section><footer>Scope version ${scope.version}. Original lesson aliases remain available in every unit. Many-to-many links labelled partial or reinforcement do not create task coverage.</footer></main>
<script id="scope-data" type="application/json">${data}</script>
<script>
const scope=JSON.parse(document.getElementById('scope-data').textContent);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const refs=new Map(scope.references.map(row=>[row.id,row]));
function render(){const query=document.getElementById('search').value.toLocaleLowerCase(),lang=document.getElementById('language').value,kind=document.getElementById('kind').value,family=document.getElementById('family').value;
const rows=scope.inventory.filter(row=>(lang==='all'||row.language===lang)&&(kind==='all'||row.kind===kind)&&(family==='all'||row.familyIds.includes(family))&&JSON.stringify(row).toLocaleLowerCase().includes(query));
document.getElementById('count').textContent=rows.length+' targets shown';
document.getElementById('inventory').innerHTML=rows.map(row=>{const cells=scope.cells.filter(cell=>cell.constructionId===row.id);return '<details id="target-'+esc(row.id)+'" class="'+(row.kind==='missing_target'?'gap':'')+'"><summary><span class="tag">'+esc(row.id)+'</span>'+esc(row.title)+'<small>'+esc(row.familyIds.join(' · '))+' · '+(row.level?'Source placement '+esc(row.level):'Placement pending')+' · '+(row.kind==='missing_target'?'Tasks need authoring':row.kind==='additional_target'?'Additional practice authored':'Original lesson mapped')+'</small></summary><dl>'+[['Form',row.form],['Meaning',row.meaning],['Use',row.use],['Contrast',row.contrast],['Alternatives',row.alternatives]].map(([label,text])=>'<dt>'+label+'</dt><dd>'+esc(text)+'</dd>').join('')+'<dt>Prerequisites</dt><dd>'+row.prerequisites.hard.length+' hard requirements; suggested: '+esc(row.prerequisites.suggested.map(edge=>edge.id).join(', ')||'none')+'</dd><dt>Lesson links</dt><dd>'+row.lessonLinks.map(link=>esc(link.id)+' ('+esc(link.relationship)+')').join(', ')+'</dd><dt>Original aliases</dt><dd>'+row.lessonLinks.map(link=>scope.crosswalk.find(item=>item.id===link.id)).filter(Boolean).flatMap(item=>item.aliases).map(esc).join('<br>')+'</dd><dt>Coverage</dt><dd>'+cells.filter(cell=>cell.status==='missing_tasks').length+' cells need tasks; '+cells.filter(cell=>!cell.required).length+' writing-only exclusions; release qualification pending.</dd><dt>References</dt><dd>'+row.references.map(id=>refs.get(id)).filter(Boolean).map(ref=>'<a href="'+esc(ref.url)+'" rel="noreferrer">'+esc(ref.title)+'</a> ('+esc(ref.access)+')').join('<br>')+'</dd><dt>Review</dt><dd>Model-authored on '+esc(row.review.date)+'. Human approval pending.</dd></dl></details>';}).join('')||'<p class="empty">No matching targets.</p>';
}for(const id of ['search','language','kind','family'])document.getElementById(id).addEventListener('input',render);render();
</script></html>`;
const work = scope.cells
  .filter((row) => row.required)
  .map((row) => ({
    id: `SCOPE-${row.id}`,
    constructionId: row.constructionId,
    stage: row.stage,
    modality: row.modality,
    status: row.status,
    work: row.work,
    references: row.referenceIds,
  }));
const outputs: [string, string][] = [
  [SCOPE_OUTPUT, JSON.stringify(scope, null, 2) + "\n"],
  [
    "docs/grammar-scope/missing-work.json",
    JSON.stringify(
      {
        schemaVersion: 1,
        scopeVersion: scope.version,
        sourceSummary: scope.summary,
        work,
        crossCutting: [
          {
            id: "SCOPE-INTERACTION",
            status: "missing_tasks",
            work: "Author contingent dialogue tasks; single recorded responses are not interaction evidence.",
            downstream: ["L01", "L03"],
          },
        ],
      },
      null,
      2,
    ) + "\n",
  ],
  ["docs/LANGUAGE-GRAMMAR-SCOPE.html", html],
];
for (const [path, contents] of outputs) {
  if (Bun.argv.includes("--check")) {
    if ((await readFile(resolve(root, path), "utf8")) !== contents)
      throw new Error(`Stale scope output: ${path}`);
  } else await writeFile(resolve(root, path), contents);
}
console.log(JSON.stringify(scope.summary, null, 2));
if (
  Bun.argv.includes("--release") &&
  scope.summary.qualifiedReleaseCells < scope.summary.requiredCells
)
  process.exitCode = 2;
