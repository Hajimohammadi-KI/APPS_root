import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { sha256 } from "./backup";
import type { Language } from "./contracts";
import type { CurriculumPack } from "./curriculum";
import {
  createTransformerRoute,
  validateTransformerRelease,
} from "./transformer-route";
/** Node-only loader. The release file and its exact digest are server settings. */
export function createInstalledTransformerRoute(language: Language) {
  return createTransformerRoute({
    language,
    async loadRelease() {
      const file = process.env.AUTOMATICITY_TRANSFORMER_RELEASE,
        digest = process.env.AUTOMATICITY_TRANSFORMER_RELEASE_SHA256;
      if (!file || !digest) return null;
      if (
        !/^[a-f0-9]{64}$/i.test(digest) ||
        (await stat(file)).size > 1_000_000
      )
        throw Error("Invalid pinned release file");
      const bytes = await readFile(file);
      if ((await sha256(new Uint8Array(bytes).buffer)) !== digest.toLowerCase())
        throw Error("Transformer release file changed");
      return validateTransformerRelease(
        JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, "")),
      );
    },
    async loadPack() {
      return JSON.parse(
        await readFile(
          resolve(
            process.cwd(),
            "public",
            "learning-core",
            `curriculum-${language}.json`,
          ),
          "utf8",
        ),
      ) as CurriculumPack;
    },
  });
}
