import {mkdir,rename} from "node:fs/promises";
import {resolve} from "node:path";
import {hash} from "./core";
const root=resolve(import.meta.dir,"data/audio-model");await mkdir(root,{recursive:true});
const metadata=await Bun.file(resolve(import.meta.dir,"../../artifacts/r36-datasets-20261003/audio-model-metadata.json")).json() as {sha:string;siblings:{rfilename:string;lfs?:{sha256:string}}[]};
const revision=metadata.sha, subfolder="hubert/general/07_hubert-base-ls960";
const modelHash=metadata.siblings.find(x=>x.rfilename===`${subfolder}/model.safetensors`)?.lfs?.sha256;if(!modelHash)throw Error("Missing pinned model hash");
const baseMetadata={sha:"dba3bb02fda4248b6e082697eee756de8fe8aa8a"};
const sources=[{name:"model.safetensors",url:`https://huggingface.co/haeylee/ssl_ft_pron/resolve/${revision}/${subfolder}/model.safetensors`,expected:modelHash},...['preprocessor_config.json','args.json','trainer_args.json','trainer_state.json'].map(name=>({name,url:`https://huggingface.co/haeylee/ssl_ft_pron/resolve/${revision}/${subfolder}/${name}`,expected:null})),{name:"config.json",url:`https://huggingface.co/facebook/hubert-base-ls960/resolve/${baseMetadata.sha}/config.json`,expected:null}];
const receipts=[];
for(const source of sources){const file=resolve(root,source.name);if(!await Bun.file(file).exists()){const transfer=Bun.spawn(['curl.exe','--fail','--location','--silent','--show-error','--connect-timeout','30','--max-time','600','--output',file+'.partial',source.url],{stderr:'inherit'});if(await transfer.exited!==0)throw Error(`Download failed ${source.name}`);await rename(file+'.partial',file);}
 const sha256=hash(new Uint8Array(await Bun.file(file).arrayBuffer()));if(source.expected&&source.expected!==sha256)throw Error(`Hash mismatch ${source.name}`);receipts.push({...source,sha256,bytes:Bun.file(file).size});}
await Bun.write(resolve(root,"receipt.json"),JSON.stringify({revision,baseRevision:baseMetadata.sha,source:"https://github.com/hy310/ssl_finetuning",license:"Code MIT. Model card does not explicitly license weights; local research evaluation only, do not redistribute or deploy weights until clarified.",scope:"English L2 read speech; corpus diagnostic, never German or grammar",selectionRisk:"Author code evaluates test_ds each epoch; treat checkpoint test results as reproduction, not untouched qualification.",files:receipts},null,2));
console.log(JSON.stringify({revision,modelHash,files:receipts.length}));
