import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const products = [
  { path: "Apps/English/English-Automaticity/apps/web/public/sw.js", prefix: "english-automaticity-" },
  { path: "Apps/Deutsch/Deutsch-Automaticity/apps/web/public/sw.js", prefix: "deutschflow-" },
];

for (const product of products) {
  test(`${product.prefix} keeps API and external traffic outside the cache`, async () => {
    const handlers: Record<string, (event: { request: Request; respondWith: (response: unknown) => void }) => void> = {};
    vm.runInNewContext(await readFile(product.path, "utf8"), {
      URL,
      self: { location: { origin: "https://app.example" }, addEventListener: (name: string, callback: (event: never) => void) => { handlers[name] = callback as typeof handlers[string]; } },
    });
    for (const request of [new Request("https://app.example/api/health"), new Request("https://app.example/api/v1/evaluate"), new Request("https://external.example/asset"), new Request("https://app.example/practice", { method: "POST" })]) {
      let intercepted = false;
      handlers.fetch!({ request, respondWith() { intercepted = true; } });
      expect(intercepted).toBe(false);
    }
  });

  test(`${product.prefix} activation preserves unrelated caches and the current release`, async () => {
    const handlers: Record<string, (event: { waitUntil: (promise: Promise<unknown>) => void }) => void> = {};
    const deleted: string[] = [];
    const source = await readFile(product.path, "utf8");
    const current = source.match(/const CACHE = "([^"]+)"/)![1]!;
    vm.runInNewContext(source, {
      self: { addEventListener: (name: string, callback: (event: never) => void) => { handlers[name] = callback as typeof handlers[string]; }, clients: { claim: async () => undefined } },
      caches: { keys: async () => [current, `${product.prefix}old`, "other-app"], delete: async (key: string) => { deleted.push(key); return true; } },
    });
    let completion: Promise<unknown> | undefined;
    handlers.activate!({ waitUntil(promise) { completion = promise; } });
    await completion;
    expect(deleted).toEqual([`${product.prefix}old`]);
  });
  test(`${product.prefix} preserves offline route identity with lesson parameters`, async () => {
    const handlers: Record<string, (event: { request: {url: string;method: string;mode: string;headers: Headers};respondWith: (response: Promise<Response>)=>void })=>void> = {};
    const cachedRoutes = new Set(["/practice", product.prefix.startsWith("english") ? "/grammar" : "/grammatik", product.prefix.startsWith("english") ? "/daily" : "/heute"]);
    vm.runInNewContext(await readFile(product.path,"utf8"), {
      URL, Response, self:{location:{origin:"https://app.example"},addEventListener:(name:string,handler:typeof handlers[string])=>{handlers[name]=handler;}},
      fetch:async()=>{throw new Error("offline");}, caches:{match:async(path:string)=>cachedRoutes.has(path)?new Response(path):undefined},
    });
    for (const route of cachedRoutes) {
      let response: Promise<Response> | undefined;
      handlers.fetch!({request:{url:`https://app.example${route}?topic=New&level=A2`,method:"GET",mode:"navigate",headers:new Headers()},respondWith:value=>{response=value;}});
      expect(await (await response!).text()).toBe(route);
    }
  });
  test(`${product.prefix} never stores Next flight responses as page HTML`, async () => {
    const handlers: Record<string, (event: {request: Request;respondWith:(response:Promise<Response>)=>void;waitUntil:(promise:Promise<unknown>)=>void})=>void>={};
    let writes=0; const pending:Promise<unknown>[]=[];
    vm.runInNewContext(await readFile(product.path,"utf8"), {
      URL,Response,self:{location:{origin:"https://app.example"},addEventListener:(name:string,handler:typeof handlers[string])=>{handlers[name]=handler;}},
      fetch:async()=>new Response("flight",{headers:{"content-type":"text/x-component"}}),caches:{open:async()=>({put:async()=>{writes++;}})},
    });
    handlers.fetch!({request:new Request("https://app.example/"),respondWith:value=>pending.push(value),waitUntil:value=>pending.push(value)});
    await Promise.all(pending); expect(writes).toBe(0);
  });
}
