import {readFile,writeFile} from "node:fs/promises";
import {relative,resolve} from "node:path";
import {isRecord} from "../shared/learning-core/src/automaticity/contracts";
import {caseDigest,digest,evidenceFile,parseManifest,reviewedManifest,type ReviewLabel} from "./lib/model-benchmark";
const root=resolve(import.meta.dir,".."),[manifestFile,reviewFile,outputFile]=Bun.argv.slice(2);
if(!manifestFile||!reviewFile||!outputFile)throw Error("Usage: bun scripts/import-model-benchmark-review.ts manifest.json reviewer-export.json new-manifest.json");
const manifest=parseManifest(JSON.parse(await readFile(resolve(root,manifestFile),"utf8")));
const bytes=await readFile(resolve(root,reviewFile),"utf8"),review:unknown=JSON.parse(bytes);
if(!isRecord(review)||review.schemaVersion!==1||review.benchmarkVersion!==manifest.version||typeof review.reviewerId!=="string"||!review.reviewerId.trim()||typeof review.role!=="string"||!review.role.trim()||typeof review.reviewedAt!=="string"||!Number.isFinite(Date.parse(review.reviewedAt))||Date.parse(review.reviewedAt)>Date.now()||Date.parse(review.reviewedAt)<Date.parse(manifest.createdAt)||!Array.isArray(review.labels)||!review.labels.length)throw Error("Invalid reviewer export");
const evidence={path:relative(root,resolve(root,reviewFile)),sha256:digest(bytes)};await evidenceFile(root,evidence);
const seen=new Set<string>();
for(const item of review.labels){
 if(!isRecord(item)||typeof item.caseId!=="string"||seen.has(item.caseId)||!isRecord(item.label))throw Error("Invalid or duplicate review label");seen.add(item.caseId);
 const row=manifest.cases.find(row=>row.id===item.caseId);if(!row||row.authoredBy===review.reviewerId||item.caseSha256!==caseDigest(row)||row.reviews.some(entry=>entry.reviewerId===review.reviewerId))throw Error("Unknown, stale, duplicate or self-authored review");
 const label=item.label;if(!["pass","needs_repair","target_not_observed","not_assessed"].includes(String(label.verdict))||![true,false,null].includes(label.targetObserved as boolean|null)||![true,false,null].includes(label.meaningPreserved as boolean|null)||typeof label.note!=="string"||!label.note.trim())throw Error("Incomplete review label");
 row.reviews.push({reviewerId:review.reviewerId,role:review.role,reviewedAt:review.reviewedAt,caseSha256:caseDigest(row),label:label as unknown as ReviewLabel,evidence});
 // A disagreement is kept for adjudication; it never silently chooses a convenient label.
 if(row.reviews.length>=2){try{Object.assign(row,(await reviewedManifest(root,{...manifest,cases:[row]})).cases[0]);}catch(error){if(!String(error).includes("adjudication required"))throw error;}}
}
const output=resolve(root,outputFile);if(output===resolve(root,manifestFile))throw Error("Keep the original manifest; choose a new output path");
await writeFile(output,JSON.stringify(manifest,null,2),{flag:"wx"});console.log(`Imported ${review.labels.length} labels. ${manifest.cases.filter(row=>row.reviewStatus==="reviewed").length} cases have completed recorded review. Reviewer identities are locally recorded, not authenticated.`);
