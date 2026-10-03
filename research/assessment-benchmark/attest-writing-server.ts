import {resolve} from "node:path";
import {createReadStream} from "node:fs";
import {createHash} from "node:crypto";
export async function attestWritingServer() {
  const base=resolve(import.meta.dir,"data"), model=resolve(base,"Qwen3-4B-Q4_K_M.gguf");
  const digest=createHash("sha256");for await(const chunk of createReadStream(model))digest.update(chunk);
  const modelSha256=digest.digest("hex");if(modelSha256!=="7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5")throw Error("Model artifact changed");
  const key=(await Bun.file(resolve(base,"llama-api-key.local")).text()).trim();
  const response=await fetch("http://127.0.0.1:8769/props",{headers:{authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error("Model identity unavailable");
  const props=await response.json() as {model_path:string;build_info:string;total_slots:number;cors_proxy_enabled:boolean;default_generation_settings:unknown;chat_template:string};
  if(resolve(props.model_path)!==model||props.build_info!=="b11146-7fe450e19"||props.total_slots!==4||props.cors_proxy_enabled)throw Error("Unexpected model server");
  return {checkedAt:new Date().toISOString(),modelSha256,build:props.build_info,slots:props.total_slots,modelPath:props.model_path,chatTemplateSha256:createHash("sha256").update(props.chat_template).digest("hex"),defaults:props.default_generation_settings};
}
if(import.meta.main){const identity=await attestWritingServer();await Bun.write(resolve(import.meta.dir,"runs/writing-qwen3-4b-v1/identity-post-run.json"),JSON.stringify({phase:"post-run verification; no claim of pre-run attestation for v1",...identity},null,2)+"\n");console.log("Post-run model identity verified");}
