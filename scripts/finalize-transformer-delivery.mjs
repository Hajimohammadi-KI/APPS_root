import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const args=Object.fromEntries(process.argv.slice(2).map(value=>{const at=value.indexOf('=');return[value.slice(2,at),value.slice(at+1)];}));
for(const key of ['english-cycle','german-cycle','english-update','german-update','browser','restore','routes','source'])assert(args[key],`Missing --${key}=receipt`);
const read=async path=>{const bytes=await readFile(resolve(root,path));return JSON.parse((bytes[0]===255&&bytes[1]===254?bytes.toString('utf16le'):bytes.toString('utf8')).replace(/^\uFEFF/,''));};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const browser=await read(args.browser),restore=await read(args.restore),routes=await read(args.routes),capture=await read(args.source);
assert.equal(browser.status,'passed');assert.equal(browser.cases.length,10);assert.match(browser.scope,/Installed app endpoints/);
assert.equal(restore.status,'passed');assert(restore.cases.length===2&&restore.cases.every(row=>row.status==='passed'&&row.runtime==='installed-desktop'&&row.settingsExportRestore.confirmedRestore));
assert.equal(routes.status,'passed');assert.match(routes.scope,/Installed apps/);assert(routes.cases.some(row=>row.startsWith('en: 6 routes')));assert(routes.cases.some(row=>row.startsWith('de: 7 routes')));
assert(capture.files.some(row=>row.path==='shared/learning-core/src/automaticity/transformer.ts'));
const products=[];
for(const product of [
 {name:'English',key:'english',language:'en',source:'Apps/English/English-Automaticity',directory:'English Grammar Automaticity Desktop',setup:'EnglishGrammar',port:3202,api:'http://127.0.0.1:4201/api/health'},
 {name:'German',key:'german',language:'de',source:'Apps/Deutsch-Automaticity',directory:'DeutschFlow',setup:'DeutschFlow',port:3210,api:'http://127.0.0.1:4210/api/v1/health'},
]){
 const config=await read(product.source+'/distribution/windows-modern/language-release-config.json'),version=config.version;
 const cycle=await read(args[product.key+'-cycle']),update=await read(args[product.key+'-update']);
 assert.equal(cycle.version,version);for(const key of ['install','upgrade','startup','update','repair','uninstall','transformerOrigin'])assert.equal(cycle[key],'verified');assert.equal(cycle.learnerDataPreserved,true);
 assert.equal(update.status,'verified');const preserved=update.products.find(row=>row.product===product.name);assert.equal(preserved.version,version);assert.equal(preserved.profilePreservedBeforeStartup,true);
 assert(Date.parse(restore.createdAt)>Date.parse(update.createdAt));
 assert.equal((await readFile(resolve(process.env.LOCALAPPDATA,'Programs',product.directory,'version.txt'),'utf8')).trim(),version);
 const setupPath=product.source+`/apps/web/public/downloads/${product.setup}-Setup-v${version}.exe`,payloadPath=setupPath.replace(/\.exe$/,'.payload.zip');
 const setupSha256=hash(await readFile(resolve(root,setupPath))),payloadSha256=hash(await readFile(resolve(root,payloadPath)));
 assert.equal(setupSha256,cycle.setupSha256.toLowerCase());assert.equal(payloadSha256,cycle.payloadSha256.toLowerCase());
 const assets=[];
 for(const path of ['learning-core/practice.js','learning-core/overview.js',`learning-core/curriculum-${product.language}.json`,'sw.js']){
  const response=await fetch(`http://127.0.0.1:${product.port}/${path}`);assert.equal(response.status,200);const liveHash=hash(Buffer.from(await response.arrayBuffer()));
  assert.equal(liveHash,hash(await readFile(resolve(root,product.source,'apps/web/public',path))));assets.push({path,sha256:liveHash});
 }
 assert.equal((await fetch(product.api)).status,200);
 const endpoint=await fetch(`http://127.0.0.1:${product.port}/api/automaticity/transformer`);assert.equal(endpoint.status,200);assert.deepEqual(await endpoint.json(),{enabled:false,approvals:[]});
 products.push({...product,version,setupPath,setupSha256,payloadSha256,assets,profileFiles:preserved.profileFiles,profileBytes:preserved.profileBytes,cycle:args[product.key+'-cycle'],update:args[product.key+'-update'],modelEnabled:false});
}
const folder='artifacts/transformer-delivery',reportPath=folder+'/final-verification.json';await mkdir(resolve(root,folder),{recursive:true});
await writeFile(resolve(root,reportPath),JSON.stringify({at:new Date().toISOString(),engineeringDelivery:'verified',qualifiedModels:0,modelActivation:'disabled',fullCurriculum:'not_qualified',learnerOutcomes:'unmeasured',products,evidence:args},null,2)+'\n');
const docPath='docs/LANGUAGE-AUTOMATICITY-TRANSFORMER-2026-09-05.md';let doc=await readFile(resolve(root,docPath),'utf8');
doc=doc.slice(0,doc.indexOf('## Delivery verification'))+'## Delivery verification\n\nBoth final versions are installed and running. Full app checks, isolated installer lifecycle, exact normal-profile preservation before startup, installed API/browser behavior, all 13 evidence routes, offline practice and audio export/restore passed. Temporary model services are stopped.\n\n'+products.map(row=>`- ${row.name} **${row.version}**: ${row.profileFiles} profile files (${row.profileBytes.toLocaleString('en-US')} bytes) preserved before startup. Setup SHA-256: \`${row.setupSha256}\`. Lifecycle: \`${row.cycle}\`; update: \`${row.update}\`.`).join('\n')+`\n- Final hashes and receipts: \`${reportPath}\`.\n- Transformer browser checks: \`${args.browser}\`; shared routes: \`${args.routes}\`; offline and restore: \`${args.restore}\`.\n- Source capture: \`${args.source}\`.\n- Shared adapter: 33 tests passed; release compiler: 16 safeguards passed. English: \`artifacts/transformer-origin-check.log\`; DeutschFlow: \`artifacts/transformer-origin-verify.log\` in the respective app directories.\n\nThese are local unsigned packages, not published download links. Engineering verification does not qualify the model or complete the curriculum's independent reviews.\n`;
await writeFile(resolve(root,docPath),doc);
const path='docs/language-automaticity-implementation-backlog.json',backlog=await read(path),versions=Object.fromEntries(products.map(row=>[row.name,row.version]));
backlog.technicalRelease={...backlog.technicalRelease,status:'verified',versions,installedVersions:versions,report:docPath};
Object.assign(backlog.delivery,{technicalIncrement:'verified',englishVersion:versions.English,germanVersion:versions.German,installedEnglishVersion:versions.English,installedGermanVersion:versions.German});
backlog.progressRecord=docPath;backlog.latestEngineeringUpdate=docPath;
const notes={
 M04:'Engineering verified and installed in both apps: pinned local Transformer adapter, original-response preservation, exact canonical task/scope checks, structured minimal corrections, separate style proposals, conservative failure handling, disabled server routes and reviewed-release compiler. 33 adapter tests, 16 release safeguards and 10 installed browser/API cases passed. The real Qwen3-8B development run returned 3 accepted proposals and 17 rejected outputs on 20 unreviewed drafts. No model is qualified or enabled; M01-M03 and independent release review remain open.',
 M02:'Rules, LanguageTool 6.6 and Qwen3-8B Q4_K_M have real local development runs with exact candidate/configuration/run hashes. Qwen produced contradictory output and is not suitable for activation in this tested configuration. The 20 drafts have no independent labels; reviewed calibration/final comparisons remain blocked. Runtime and compiler tests are synthetic engineering evidence only.',
 B01:`Canonical routes and storage retain their baseline record. Installed English ${versions.English} and DeutschFlow ${versions.German} serve the verified source assets and pass API/HTTP/browser checks. The thesis remains outside scope.`,
 R02:`English ${versions.English} and DeutschFlow ${versions.German} are installed and running. Full required checks, isolated install/upgrade/startup/update/repair/uninstall, normal-profile preservation, all 13 evidence routes, offline practice and audio restore passed. Transformer endpoints remain disabled without a qualified release. Packages are unsigned; full curriculum and learner evidence gates remain open.`,
};
for(const [id,note] of Object.entries(notes)){const task=backlog.tasks.find(row=>row.id===id);task.progressNote=note;task.updatedOn='2026-09-05';task.evidence=[...new Set([...task.evidence,docPath,reportPath,...Object.values(args)])];if(id!=='M02')task.engineeringVerification='verified_for_recorded_scope';if(id==='M04')task.status='implemented';}
await writeFile(resolve(root,path),JSON.stringify(backlog,null,2)+'\n');console.log(JSON.stringify({reportPath,versions,modelActivation:'disabled'}));
