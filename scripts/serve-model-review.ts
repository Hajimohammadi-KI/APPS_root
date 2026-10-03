import {resolve} from "node:path";
const file=resolve(import.meta.dir,"../docs/model-evaluation/REVIEW.html");
const server=Bun.serve({hostname:"127.0.0.1",port:3320,fetch(request){
 const path=new URL(request.url).pathname;
 if(request.method!=="GET"||!["/","/REVIEW.html"].includes(path))return new Response("Not found",{status:404});
 return new Response(Bun.file(file),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}});console.log(`Benchmark review: http://127.0.0.1:${server.port}`);
