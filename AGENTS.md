# Language app delivery requirements

For changes to English Automaticity and DeutschFlow:

- Maintain `docs/language-apps-roadmap.json` before and during work. Generate the visible Persian roadmap with `bun scripts/language-apps-roadmap.mjs`.
- Preserve these production URLs: `https://english-grammar-automaticity-pwa.vercel.app/` and `https://deutschflow-grammar.vercel.app/`.
- A requested app change includes updating its existing production project after appropriate checks. Do not substitute a new project or URL. Record a deployment as published only after checking the release marker on the canonical URL.
- If deployment access is unavailable, finish authorized local work and record the precise outstanding publication step. Do not claim the online app was updated.
- Use Bun. Respect more specific app instructions. Preserve learner data and make a file backup before modifying existing source when Git is unavailable.

Active paths: `Apps/English/English-Automaticity` and `Apps/Deutsch/Deutsch-Automaticity`.

## Working through the roadmap

- Do the `work` items in `docs/language-apps-roadmap.json` in order; read its `handoff` first. Do not add new planning items or documents; deliver code and update the existing W items and R96–R101.
- No change may mark a wrong answer as correct. Never overwrite a learner's explicit stored choice.
- Per item: confirm the defect from code or real output, write a failing offline test, then fix it until the test passes.
- Edit learning-core only in `shared/learning-core`. Rebuild browser bundles when browser entries change (`bun run build:browser` / `build:automaticity`), then run `node shared/learning-core/sync-workspaces.mjs` and `--check`. A rebuilt `adherence-shadow.js` usually differs only in line endings; restore it with `git checkout`.
- Checks: English `bun run check` and `bun run build`; German `bun run verify`. Format changed files, including `shared/learning-core`, with the German Prettier config. German TypeScript uses `exactOptionalPropertyTypes`.
- Release steps, project ids and the deploy command are in `docs/RELEASE-READINESS.md`. Mark an item `tested` with a `local` change entry before deploying. After the release marker and browser checks pass on both canonical URLs, mark it `published`, regenerate, commit and deploy again so the hosted `/roadmap.html` is final. Do not push unless asked.

## Environment notes

- `START-LANGUAGE-DEVICES.cmd` (ports 3203/3211) serves the packaged runtime in `artifacts/release-runtime`, not the latest build. To test fresh builds, run English `PORT=3202 HOSTNAME=127.0.0.1 node server.js` in `apps/web/.next/standalone/apps/web` and German `node ../../scripts/start-standalone.mjs --hostname 127.0.0.1 --port 3210` in `apps/web`. Stop them before `bun run build` (EBUSY otherwise).
- Run Playwright scripts with Node (for example `node scripts/studio-flow-check.mts <base-url>`), not Bun.
- The IDE may auto-commit saved files. For baselines, use `git worktree` or `git show <commit>:<file>` instead of checking out older files, and keep scratch scripts outside the repository.
- Known pre-existing failures: two German e2e tests in `apps/web/e2e/runtime-evidence-slice.spec.ts` and the German browser tests listed in the roadmap handoff notes.
- The public LanguageTool API can respond slowly; rerun a timed-out evaluation before treating it as a failure.
