import { resolve } from "node:path";
import { auditInstalledCoverage } from "./lib/installed-coverage";

const argument = (name: string) =>
  Bun.argv
    .find((value) => value.startsWith(`--${name}=`))
    ?.slice(name.length + 3);
const coveragePath = argument("coverage"),
  reviewsPath = argument("reviews");
const result = await auditInstalledCoverage(resolve(import.meta.dir, ".."), {
  installedOnly: Bun.argv.includes("--installed-only"),
  release: Bun.argv.includes("--release"),
  ...(coveragePath === undefined ? {} : { coveragePath }),
  ...(reviewsPath === undefined ? {} : { reviewsPath }),
});
console.log(JSON.stringify(result.report, null, 2));
process.exitCode = result.exitCode;
