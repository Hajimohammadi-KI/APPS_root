import { expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { deriveAssessmentCoverage, canonicalReviewOutputs } from "./lib/assessment-readiness";
import { loadRepresentativeRuntime } from "./lib/representative-model-candidate";
import { validateReleaseReviews, sha256 } from "./lib/automaticity-release-reviews";
import { activePracticeTasks } from "../shared/learning-core/src/automaticity/curriculum";
import { buildHumanReviewManifest } from "./lib/human-review-manifest";
import { commitReviewOutputs } from "./lib/review-output-transaction";
import { reviseVariationTasks } from "./lib/variation-revisions";
const root=resolve(import.meta.dir,"..");
test("both active apps yield complete unique coverage without inventing review approvals",async()=>{
  const runtime=await loadRepresentativeRuntime(root);
  expect(runtime.packs.map(pack=>pack.language).sort()).toEqual(["de","en"]);
  const cells=deriveAssessmentCoverage(runtime.packs,[]);
  const tasks=runtime.packs.flatMap(pack=>pack.units.flatMap(activePracticeTasks));
  expect(cells.flatMap(cell=>cell.taskIds).sort()).toEqual(tasks.map(task=>task.id).sort());
  expect(new Set(cells.map(cell=>[cell.language,cell.constructionId,cell.stage,cell.modality].join(":"))).size).toBe(cells.length);
  expect(cells.every(cell=>!cell.releaseEligible && cell.humanReview==="pending")).toBe(true);
  expect(await validateReleaseReviews(root,cells,new Map(runtime.packs.map(pack=>[pack.language,pack])),[])).toEqual({reviewedCells:0,evaluatorApprovedCells:0});
});
test("canonical review inputs join the backup transaction and survive deterministic rebuilding",async()=>{
  const pack=structuredClone((await loadRepresentativeRuntime(root)).packs[0]!);
  const manifest=buildHumanReviewManifest(pack,[]);
  const temp=await mkdtemp(resolve(tmpdir(),"language-review-source-"));
  const content=resolve(temp,"shared/learning-core/content");await mkdir(content,{recursive:true});
  for(const file of [`curriculum-${pack.language}.json`,`review-approvals-${pack.language}.json`])
    await writeFile(resolve(content,file),"previous-snapshot\n");
  const outputs=await canonicalReviewOutputs(temp,pack,manifest);
  expect(outputs.every(row=>row.expectedSha256===sha256("previous-snapshot\n"))).toBe(true);
  const folder="artifacts/curriculum-review-import/test";await mkdir(resolve(temp,folder),{recursive:true});
  await commitReviewOutputs(temp,folder,outputs);
  const saved=JSON.parse(await readFile(resolve(content,`curriculum-${pack.language}.json`),"utf8"));
  expect(reviseVariationTasks(saved)).toEqual(pack);
  expect(await readFile(resolve(temp,folder,"originals",outputs[0]!.path),"utf8")).toBe("previous-snapshot\n");
  await expect(canonicalReviewOutputs(temp,pack,{...manifest,curriculumSha256:"0".repeat(64)})).rejects.toThrow("does not match");
});
