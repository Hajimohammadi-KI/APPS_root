import { mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { digest, evidenceFile } from "./lib/model-benchmark";
import {
  validateBlindPacket,
  validateCorpusReview,
} from "./lib/r65-review-packets";

/** Read only explicitly supplied local artifacts, never arbitrary corpus/holdout paths. */
async function privateArtifact(root: string, value: string) {
  const base = await realpath(resolve(root, "artifacts/r65-human-review"));
  const path = await realpath(resolve(root, value));
  const rel = relative(base, path);
  if (isAbsolute(rel) || rel.startsWith("..") || !rel)
    throw Error(
      "Review inputs must be inside ignored artifacts/r65-human-review",
    );
  const bytes = await readFile(path, "utf8");
  if (bytes.length > 5_000_000) throw Error("Review input exceeds size limit");
  const ref = { path: relative(root, path), sha256: digest(bytes) };
  await evidenceFile(root, ref);
  return { bytes, ref };
}

if (import.meta.main) {
  const [packetFile, reviewFile, outputName] = Bun.argv.slice(2);
  if (
    !packetFile ||
    !reviewFile ||
    !outputName ||
    !/^[a-z0-9][a-z0-9-]{2,79}$/u.test(outputName)
  )
    throw Error(
      "Usage: bun scripts/validate-r65-human-review.ts private-packet.json actual-review.json new-output-name",
    );
  const root = resolve(import.meta.dir, "..");
  const packet = await privateArtifact(root, packetFile),
    review = await privateArtifact(root, reviewFile);
  const source: unknown = JSON.parse(packet.bytes);
  validateBlindPacket(source);
  const result = validateCorpusReview(
    source,
    JSON.parse(review.bytes),
    new Date().toISOString(),
  );
  const output = resolve(root, "artifacts/r65-human-review", outputName);
  await mkdir(output);
  await writeFile(
    resolve(output, "receipt.json"),
    JSON.stringify(
      {
        schemaVersion: 1,
        kind: "r65-local-review-receipt",
        packet: packet.ref,
        review: review.ref,
        reviewerId: result.reviewerId,
        validatedLabels: result.count,
        validatedAt: new Date().toISOString(),
        identityAuthenticated: false,
        independentPairEstablished: false,
        adjudicationEstablished: false,
        sourceLabelsOverwritten: false,
        automaticallyApproved: false,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx" },
  );
  console.log(
    JSON.stringify({
      output,
      validatedLabels: result.count,
      independentPairEstablished: false,
      automaticallyApproved: false,
    }),
  );
}
