import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { digest } from "./lib/model-benchmark";
import {
  blankCorpusReview,
  buildBlindPacket,
  R65_DEVELOPMENT_PATH,
  R65_DEVELOPMENT_SHA256,
  taskIntakeTemplate,
  type BlindPacket,
} from "./lib/r65-review-packets";

export function offlineForm(
  packet: BlindPacket,
  title: "Independent reviewer A" | "Independent reviewer B",
) {
  // Corpus text is untrusted. Escape script delimiters and render only via textContent.
  const embedded = JSON.stringify({
    packet,
    form: blankCorpusReview(packet),
  }).replace(/</gu, "\\u003c");
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; form-action 'none'; base-uri 'none'"><title>${title}</title>
<style>body{max-width:56rem;margin:auto;padding:2rem;font:18px/1.6 system-ui;color:#142c30;background:#f8f8f3}label,textarea,input,select{display:block}input,textarea,select,button{font:inherit;padding:.6rem;max-width:100%;box-sizing:border-box}textarea,input{width:100%}article{padding:1rem;border:1px solid #59706d;margin:1.5rem 0;background:white}pre{white-space:pre-wrap;font:inherit}button{margin:1rem 0}*:focus-visible{outline:3px solid #174b9a;outline-offset:3px}</style>
<h1>${title}</h1><p>Development review only. Judge the target, using original context for interpretation. Context may itself contain errors. Distinguish required grammar, spelling, punctuation and word-use corrections from stylistic preference. Preserve names, facts, polarity, tense and meaning. If context is insufficient, choose uncertain. No task-target compliance, speech or release approval is measured.</p>
<p>Work independently before discussion. Do not consult source corrections, model predictions or another reviewer's labels. Each reviewer needs their own copy. No form content is sent over the network or saved automatically; download completed labels before closing.</p>
<label>Reviewer identifier<input id="reviewer"></label><label>Language-review role<input id="role"></label><label><input type="checkbox" id="attest"> I am the human reviewer, worked independently, and did not consult source corrections or model predictions.</label><section id="cases"></section><button id="export">Download completed judgments</button><p id="status" role="status" aria-live="polite"></p>
<script type="application/json" id="packet">${embedded}</script><script>
const {packet,form}=JSON.parse(document.getElementById('packet').textContent);
const container=document.getElementById('cases'),inputs=[];
function text(parent,tag,value){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
function field(parent,label,tag,choices){const wrapper=text(parent,'label',label),el=document.createElement(tag);if(choices)for(const [value,name] of choices){const option=text(el,'option',name);option.value=value;}if(tag==='textarea')el.rows=3;wrapper.append(el);return el;}
for(const row of packet.cases){const article=document.createElement('article');container.append(article);text(article,'h2',row.language.toUpperCase()+' · '+row.caseId);text(article,'p','Original context before');text(article,'pre',row.originalContext.before);text(article,'h3','Target to judge');text(article,'pre',row.target);text(article,'p','Original context after');text(article,'pre',row.originalContext.after);const grammar=field(article,'Judgment','select',[['','Choose'],['acceptable','Acceptable as written'],['needs_repair','Necessary repair'],['uncertain','Cannot determine']]),context=field(article,'Context sufficient?','select',[['','Choose'],['true','Yes'],['false','No'],['null','Uncertain']]),correction=field(article,'Minimal correction (only if necessary repair)','textarea'),note=field(article,'Reason, ambiguity or acceptable alternative','textarea');inputs.push({row,grammar,context,correction,note});}
document.getElementById('export').onclick=async()=>{const status=document.getElementById('status'),reviewerId=document.getElementById('reviewer').value.trim(),role=document.getElementById('role').value.trim();if(!reviewerId||!role||!document.getElementById('attest').checked){status.textContent='Enter your identity and role, and confirm independent human review.';return;}const labels=[];for(const {row,grammar,context,correction,note} of inputs){if(!grammar.value&&!context.value&&!correction.value&&!note.value)continue;if(!grammar.value||!context.value||!note.value.trim()||(grammar.value==='needs_repair'?!correction.value.trim():!!correction.value)){status.textContent='Finish all fields in each started case. Corrections belong only to necessary repairs.';return;}let correctionSha256=null;if(grammar.value==='needs_repair'){if(!crypto.subtle){status.textContent='Hashing is unavailable in this browser. Retain the form and use a supported local browser.';return;}correctionSha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(correction.value)))].map(v=>v.toString(16).padStart(2,'0')).join('');}labels.push({caseId:row.caseId,caseSha256:row.caseSha256,grammar:grammar.value,contextSufficient:JSON.parse(context.value),minimalCorrection:grammar.value==='needs_repair'?correction.value:null,correctionSha256,note:note.value.trim()});}if(!labels.length){status.textContent='Complete at least one judgment.';return;}const output={...form,provenance:'human_review',reviewerId,role,reviewedAt:new Date().toISOString(),independentlyReviewed:true,sourceCorrectionsHidden:true,modelPredictionsHidden:true,labels};const link=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(output,null,2)],{type:'application/json'}));link.href=url;link.download='r65-human-review.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent=labels.length+' judgments exported. Local identity is recorded, not authenticated. Import validation is still required.';};
</script></html>`;
}

export async function prepareR65(root: string, folderName: string) {
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/u.test(folderName))
    throw Error("Use a new simple lowercase output name");
  const bytes = await readFile(resolve(root, R65_DEVELOPMENT_PATH), "utf8");
  // A fixed development allowlist prevents accidentally passing a holdout path.
  if (digest(bytes) !== R65_DEVELOPMENT_SHA256)
    throw Error("The frozen R59/R61 development file changed");
  const createdAt = new Date().toISOString();
  const built = buildBlindPacket(
    bytes,
    { count: 128, sha256: R65_DEVELOPMENT_SHA256 },
    randomUUID(),
    createdAt,
  );
  if (
    built.publicSummary.languages.en !== 64 ||
    built.publicSummary.languages.de !== 64
  )
    throw Error("Language counts changed");
  const codePaths = [
    "scripts/prepare-r65-human-review.ts",
    "scripts/lib/r65-review-packets.ts",
    "scripts/lib/model-benchmark.ts",
  ];
  const codeHashes = Object.fromEntries(
    await Promise.all(
      codePaths.map(async (path) => [
        path,
        digest(await readFile(resolve(root, path), "utf8")),
      ]),
    ),
  );
  const publicSummary = {
    ...built.publicSummary,
    source:
      "Frozen R59/R61 original-context development set: Write & Improve, Falko and MERLIN",
    sourcePath: R65_DEVELOPMENT_PATH,
    codeHashes,
  };
  const parent = resolve(root, "artifacts/r65-human-review");
  await mkdir(parent, { recursive: true });
  const output = resolve(parent, folderName);
  await mkdir(output); // Refuse existing output rather than replacing reviews.
  await mkdir(resolve(output, "reviewers"));
  await mkdir(resolve(output, "coordinator"));
  const files: Record<string, string> = {
    "reviewers/packet.json": JSON.stringify(built.packet, null, 2),
    "reviewers/reviewer-a.json": JSON.stringify(
      blankCorpusReview(built.packet),
      null,
      2,
    ),
    "reviewers/reviewer-b.json": JSON.stringify(
      blankCorpusReview(built.packet),
      null,
      2,
    ),
    "reviewers/reviewer-a.html": offlineForm(
      built.packet,
      "Independent reviewer A",
    ),
    "reviewers/reviewer-b.html": offlineForm(
      built.packet,
      "Independent reviewer B",
    ),
    "coordinator/mapping.json": JSON.stringify(
      { ...built.coordinator, developmentPath: R65_DEVELOPMENT_PATH },
      null,
      2,
    ),
    "coordinator/adjudication-template.json": JSON.stringify(
      blankCorpusReview(built.packet, "adjudication"),
      null,
      2,
    ),
    "task-intake-template.json": JSON.stringify(taskIntakeTemplate(), null, 2),
    "public-summary.json": JSON.stringify(publicSummary, null, 2),
    "README.md":
      "# R65 private review packet\n\nGive each independent reviewer only their reviewer HTML and the rubric in docs/LANGUAGE-ASSESSMENT-R65.md. Keep coordinator mapping and adjudication separate. Raw text remains local and licensed source terms continue to apply; do not publish the reviewers directory. All identities, judgments and adjudication fields are blank. The task-intake template is a separate unpopulated collection workflow, not 128 task-qualified examples. The original frozen corpus and model results are untouched.\n",
  };
  for (const [name, content] of Object.entries(files))
    await writeFile(resolve(output, name), content + "\n", { flag: "wx" });
  if (
    digest(await readFile(resolve(root, R65_DEVELOPMENT_PATH), "utf8")) !==
    R65_DEVELOPMENT_SHA256
  )
    throw Error("Frozen development file changed during packet preparation");
  return { output, ...publicSummary };
}

if (import.meta.main) {
  const root = resolve(import.meta.dir, "..");
  console.log(
    JSON.stringify(
      await prepareR65(root, Bun.argv[2] ?? "development-v1"),
      null,
      2,
    ),
  );
}
