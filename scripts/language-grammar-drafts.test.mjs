import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source = readFileSync(new URL("../shared/language-web/grammar-drafts.js", import.meta.url), "utf8");
function setup(store = new Map()) {
  const makeInput = () => ({value:"", handlers:{}, addEventListener(type, handler) {this.handlers[type]=handler;}});
  const answer=makeInput(), intent=makeInput(), window={}; let errors=0;
  vm.runInNewContext(source, {window, localStorage:{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)}});
  const drafts=window.createGrammarDrafts({language:"de",answer,intent,onError:()=>errors++});
  return {drafts,answer,intent,store,errors:()=>errors};
}
test("question changes and reload retain original text and help use separately",()=>{
  const a=setup(); a.drafts.load("A1:first"); a.answer.value="Ich bin müde."; a.intent.value="من خسته‌ام."; a.answer.handlers.input(); a.drafts.markAssisted();
  a.drafts.load("A1:second"); expect(a.answer.value).toBe(""); expect(a.drafts.assisted).toBe(false);
  const b=setup(a.store); b.drafts.load("A1:first"); expect(b.answer.value).toBe("Ich bin müde."); expect(b.intent.value).toBe("من خسته‌ام."); expect(b.drafts.assisted).toBe(true);
});
test("unreadable original drafts are reported and never overwritten",()=>{
  const a=setup(new Map([["automaticity:v2:de:grammar-draft:broken","{broken"]])); a.drafts.load("broken"); a.answer.value="new"; a.answer.handlers.input(); expect(a.errors()).toBe(2); expect([...a.store.values()]).toEqual(["{broken"]);
});
