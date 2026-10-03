import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { hash, parseM2, referenceLabel, type Sentence } from "./core";
import { annotationSlice, assertDisjoint, compact, detokenize, originalContext, surfaceKey } from "./context-data";

const base = resolve(import.meta.dir, "data"), output = resolve(import.meta.dir, "runs/writing-context-data-v2");
await mkdir(output, { recursive: true });
if (await Bun.file(resolve(output, "manifest.json")).exists()) throw Error("Frozen data exists; use a new version");
interface Document { id: string; text: string; userid?: string }
export interface ContextCase { id: string; language: "en" | "de"; source: string; sourceSplit: string; group: string; author: string | null; text: string; before: string; after: string; label: "error" | "clean"; slice: string; types: string[]; reference: Sentence }
const inputs: Record<string, string> = {};
async function sourceText(path: string) { const text = await Bun.file(path).text(); inputs[path.replace(import.meta.dir, ".").replaceAll("\\", "/")] = hash(text); return text; }
await sourceText(resolve(import.meta.dir, "prepare-context-writing.ts")); await sourceText(resolve(import.meta.dir, "context-data.ts")); await sourceText(resolve(import.meta.dir, "core.ts"));
const old = (await sourceText(resolve(import.meta.dir, "runs/writing-qwen3-4b-v1/cases.jsonl"))).trim().split("\n").map(line => JSON.parse(line) as { group: string; text: string });
const oldGroups = new Set(old.map(x => x.group)), oldSurfaces = new Set(old.map(x => surfaceKey(x.text))), oldAuthors = new Set<string>();
const enSource = resolve(base, "english/wi+locness");
for (const level of ["A", "B", "C"]) {
  const docs = (await sourceText(resolve(enSource, `json/${level}.dev.json`))).trim().split(/\r?\n/).map(line => JSON.parse(line) as Document);
  for (const doc of docs) if (oldGroups.has(`wi-locness:${doc.id}`) && doc.userid) oldAuthors.add(hash(`wi-author:${doc.userid}`));
}
const pools: Record<"development" | "holdout", ContextCase[]> = { development: [], holdout: [] }, excluded: Record<string, number> = {};
const skip = (reason: string) => { excluded[reason] = (excluded[reason] ?? 0) + 1; };
function add(split: "development" | "holdout", sentence: Sentence, info: Omit<ContextCase, "reference" | "label" | "slice" | "types">) {
  if (oldGroups.has(info.group) || (info.author && oldAuthors.has(info.author)) || oldSurfaces.has(surfaceKey(info.text))) return skip("previously inspected group, author or surface");
  const label = referenceLabel(sentence);
  if (label === "ambiguous") return skip("ambiguous reference");
  if (info.text.length < 12 || info.text.length > 600) return skip("length bounds");
  const types = [...new Set(sentence.edits.map(x => x.type))];
  pools[split].push({ ...info, label, types, slice: annotationSlice(types), reference: sentence });
}
for (const level of ["A", "B", "C"]) {
  const docs = (await sourceText(resolve(enSource, `json/${level}.train.json`))).trim().split(/\r?\n/).map(line => JSON.parse(line) as Document);
  const documents = docs.map(doc => ({ ...doc, normalized: compact(doc.text) }));
  const inverted = new Map<string, Set<number>>();
  for (const [index, doc] of docs.entries()) for (const word of new Set(doc.text.match(/[A-Za-z]{4,}/g) ?? [])) { const set = inverted.get(word) ?? new Set<number>(); set.add(index); inverted.set(word, set); }
  const sentences = parseM2(await sourceText(resolve(enSource, `m2/${level}.train.gold.bea19.m2`)));
  for (const [i, sentence] of sentences.entries()) {
    const keys = (sentence.text.match(/[A-Za-z]{4,}/g) ?? []).map(w => inverted.get(w)).filter((v): v is Set<number> => Boolean(v)).sort((a, b) => a.size - b.size);
    const candidates = keys.length ? [...keys[0]!].map(index => documents[index]!) : documents;
    const matches = candidates.filter(d => d.normalized.includes(compact(sentence.text)));
    if (matches.length !== 1) { skip("en ambiguous alignment"); continue; }
    const doc = matches[0]!, context = originalContext(doc.text, sentence.text);
    if (!context || !doc.userid) { skip("en missing unique surface or author"); continue; }
    const author = hash(`wi-author:${doc.userid}`), split = parseInt(hash(`r56-split:${author}`).slice(0, 8), 16) % 2 ? "development" : "holdout";
    add(split, sentence, { id: `wi:${level}:train:${i}`, language: "en", source: "Write & Improve", sourceSplit: "train", group: `wi-locness:${doc.id}`, author, ...context });
  }
}
for (const sourceSplit of ["train", "dev"]) {
  const mapping = new Map<string, { group: string; source: string; text: string }[]>(), documents = new Map<string, string[]>();
  for (const source of ["falko", "merlin"]) for (const line of (await sourceText(resolve(base, `german/data/source/${source}-id-ctok-zh1.txt.${sourceSplit}`))).trim().split(/\r?\n/)) {
    // Column 3 is gold-corrected text: never use it as input or context.
    const [id, original] = line.split("\t"); if (!id) throw Error("Invalid source mapping");
    if (!original?.trim()) { skip("de empty original segment"); continue; }
    const group = `${source}:${id}`, key = compact(original), entry = { group, source, text: detokenize(original) };
    mapping.set(key, [...(mapping.get(key) ?? []), entry]); documents.set(group, [...(documents.get(group) ?? []), entry.text]);
  }
  for (const [i, sentence] of parseM2(await sourceText(resolve(base, `german/data/fm-${sourceSplit}.m2`))).entries()) {
    const matches = mapping.get(compact(sentence.text));
    if (!matches || matches.length !== 1) { skip("de ambiguous alignment"); continue; }
    const match = matches[0]!, context = originalContext(documents.get(match.group)!.join(" "), sentence.text);
    if (!context) { skip("de missing unique surface"); continue; }
    add(sourceSplit === "train" ? "development" : "holdout", sentence, { id: `fm:${sourceSplit}:${i}`, language: "de", source: match.source, sourceSplit, group: match.group, author: null, ...context });
  }
}
const devGroups = new Set(pools.development.map(x => x.group)), devAuthors = new Set(pools.development.map(x => x.author).filter(Boolean)), devSurfaces = new Set(pools.development.map(x => surfaceKey(x.text)));
pools.holdout = pools.holdout.filter(x => !devGroups.has(x.group) && !(x.author && devAuthors.has(x.author)) && !devSurfaces.has(surfaceKey(x.text)));
assertDisjoint(pools.development, pools.holdout);
const selections: Record<string, unknown> = {};
for (const split of ["development", "holdout"] as const) {
  const selected: ContextCase[] = [], used = new Set<string>(), perGroup = new Map<string, number>();
  const perClass = split === "development" ? 32 : 128;
  for (const language of ["en", "de"] as const) for (const label of ["error", "clean"] as const) {
    const pool = pools[split].filter(x => x.language === language && x.label === label).sort((a, b) => hash(`r56-selection:${a.id}`).localeCompare(hash(`r56-selection:${b.id}`)));
    let count = 0;
    for (const row of pool) { const key = surfaceKey(row.text); if (used.has(key) || (perGroup.get(row.group) ?? 0) >= 4) continue; selected.push(row); used.add(key); perGroup.set(row.group, (perGroup.get(row.group) ?? 0) + 1); if (++count === perClass) break; }
    if (count !== perClass) throw Error(`Insufficient ${split} ${language} ${label}: ${count}`);
  }
  const content = selected.sort((a, b) => a.id.localeCompare(b.id)).map(x => JSON.stringify(x)).join("\n") + "\n";
  await Bun.write(resolve(output, `${split}.jsonl`), content);
  selections[split] = { count: selected.length, sha256: hash(content), groups: new Set(selected.map(x => x.group)).size, authors: new Set(selected.map(x => x.author).filter(Boolean)).size, available: Object.fromEntries(["en", "de"].map(lang => [lang, Object.fromEntries(["error", "clean"].map(label => [label, pools[split].filter(x => x.language === lang && x.label === label).length]))])) };
}
const manifest = { schemaVersion: 1, createdAt: new Date().toISOString(), inputs, selections, excluded, seed: "r56-selection / r56-split", maximumTargetsPerDocument: 4, context: "Original-only 1000 characters before and after uniquely aligned target; gold edits never input. German punctuation whitespace detokenized.", labels: "Original all-edit/no-correction labels unchanged. Annotation slices are not human re-adjudication.", splitPolicy: "EN official train partition by hashed author. DE official train for development, unused official dev for holdout. Exclude old groups, known EN authors and targets; exclude cross-split group/author/target duplicates before sampling.", limitations: "German author identity unavailable beyond document IDs. Within-document observations correlated; sentence Wilson bounds descriptive. Public pretraining exposure unknown. New holdout is untouched by this workflow, not proven uncontaminated. Not app-task qualification." };
await Bun.write(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify({ selections, excluded }));
