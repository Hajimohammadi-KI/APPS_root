# Roadmap: now → all problems fixed — 2026-08-12

This consolidates three things that were previously separate: today's bug-fix pass, the crash investigation that just happened, and the standing "make it real software" roadmap. It supersedes nothing — `ACTUAL-SOFTWARE-ROADMAP-2026-08-11.md` and `CRITIQUE-AND-ROADMAP-2026-08-12.md` still hold the full detail; this is the single ordered path through all of it, including the open decisions blocking forward progress right now.

## Where things actually stand

**Fixed and verified today** (uncommitted, sitting in the working tree):
- Tracker: 4 orphaned test files now run in `bun test`; TypeScript dual-compiler investigated and documented (can't be fully resolved — upstream `typescript-eslint` blocks TS7).
- English: hardcoded name removed from `daily.html`; dead `dashboard-screen.tsx` deleted; E2E tests rewritten against the real live UI.
- German: `teacher.css` panic root-caused (stale log, not a real bug); pre-flight port-check script added for the `EADDRINUSE` crash.
- Settings: GET/list route added for uploaded files; GitHub field relabeled honestly; encryption + OAuth-refresh test coverage added.
- PDF Reader: misleading "review" button relabeled to match what it actually does.
- Cross-cutting: `safe-remote-url.ts`/`model-config.ts` drift-check script added; CI workflows added at the true repo root (the first attempt put them inside app subfolders, where GitHub Actions never discovers them — caught and fixed).
- Wrangler upgraded `4.92.0 → 4.122.0` across the Tracker app; a real config-compatibility bug (`legacy_env`) fixed permanently via `scripts/fix-wrangler-config.mjs`.

**Discovered blocking issue**: none of the three Cloudflare Workers apps (Tracker, PDF Reader, Settings) can reliably start `wrangler dev` on this machine. Root cause confirmed via reproduction + upstream reports: a Node.js v24 regression on Windows (libuv assertion during async-handle teardown), independent of our code. This machine runs Node v24.19.0.

**Paused mid-task**: the "comment every line" pass — English's `app.spec.ts` is ~70% done, the 4 CI workflow YAML files haven't been started.

**Explicitly deferred, not started** (from the original fix-all-problems pass):
- Tracker's EvidenceRecord → Retrieval → Answerability → Evaluation pipeline — this is its own multi-week project per the app's own `docs/NLP-RETRIEVAL-LAB.md` (scheduled Aug 17 – Sep 7), not a bug fix.
- Verifying the `oai-authenticated-user-*` header trust boundary (needs deployment topology info only you have).
- OAuth legacy `client_secret` sunset (blocked until PKCE migration is fully proven across all installs).
- PDF Reader real review-queue feature (currently just honestly relabeled, not built).
- Reading-position server sync (currently local-only by design; unclear if that's meant to change).

**Newly discovered this session, not yet actioned**: neither English nor German has a working way for a learner to actually set their CEFR level — the control exists in one app but writes to the wrong storage key, is absent in the other, and a placement-quiz component is built in both but never wired in.

## Open decisions blocking the next phase

These need your answer before I can move forward without guessing:

1. **Node version fix** — install Node 22 LTS scoped to these three apps (via `nvm-windows`/`fnm`), so `wrangler dev` stops crashing? This is a machine-level change I won't make unilaterally.
2. **"Use the skills at"** — your message cut off after this phrase. What were you pointing me to?
3. **"Make Update install Apps"** — confirming this means rebuild/update the Windows installers (the one in your error screenshot was for Tracker), not something else.
4. **Comment pass** — finish it, or drop it in favor of everything below?
5. **Migration order** — once unblocked, take one app fully to "real software" before the others, or work all five in parallel? My recommendation is below.

## Phase 0 — Unblock (blocked on decision #1, ~30 min once answered)

- Install Node 22 LTS, scoped so it doesn't disturb anything else on this machine that depends on Node 24.
- Point Tracker/PDF Reader/Settings' `start` scripts at it (or wrap with a version-pinned launcher).
- Re-run `bun run start` in all three; confirm each actually binds its port and serves a request. This is the exit criterion — not "the command didn't crash," but "a browser can load the page."

## Phase 1 — Close out in-flight work (today, no blockers)

- Finish or drop the comment pass per decision #4.
- Resolve decisions #2 and #3 above.
- Wire the CEFR level control properly in at least English (fix the storage-key mismatch so the working `<select>` actually syncs to real app state) — small, concrete, and directly answers a question you asked earlier this session.

## Phase 2 — Launch and visually verify all five apps (point 3 of your request)

Depends on Phase 0. For each app: start it, load it in a browser, click through the golden path, screenshot it. This is the first time any of today's fixes get confirmed against a running app rather than just tests/typecheck — everything so far has been verified through code and test output, not a live browser.

## Phase 3 — Finish the deferred items that are genuinely bounded

- Reading-position server sync: needs your call — local-only (document it) or add real sync (needs a DB decision, ties into Neon).
- PDF review queue: build it for real, or leave it honestly labeled as-is.
- `oai-authenticated-user-*` trust boundary: tell me the actual deployment topology (is the Worker URL reachable directly, or only through the ChatGPT/OpenAI gateway?) and I can close this out same-day.
- OAuth secret sunset: revisit once Phase 2 confirms PKCE actually works end-to-end in a live browser, not just in code review.

## Phase 4 — Full legacy migration ("actual software", points 1 + 4)

This is `ACTUAL-SOFTWARE-ROADMAP-2026-08-11.md` Phases 1–6, and it's the large one — legacy inventory, parity classification, durable persistence, real service integrations, complete learning/tracker vertical slices, accessibility, and a working installer/update cycle, with exit criteria that include manual hardware checks. Realistic scope: weeks, not a single session.

My recommendation for order (per decision #5): **Tracker first**, not because it's furthest along — it's the least complete (0% of its actual EvidenceRecord pipeline exists; core loops in English/German already work) — but because it's the one crashing on your machine right now, so it's already the center of attention and the freshest in context. English and German's core learning loops are real and working today; their gaps are narrower (dead code, CEFR entry, a few stale tests) and faster to close.

## Phase 5 — Installers (point 5)

Once an app's code is stable through Phase 4 for that app, rebuild its installer and test the fresh-install → update → repair cycle the existing roadmap's Phase 6 already specifies. Doing this before Phase 4 finishes for a given app just means rebuilding the installer repeatedly.

## What "all problems fixed" means as an exit condition

Every item in `CRITIQUE-AND-ROADMAP-2026-08-12.md`'s five phases closed, every item in this document's Phase 3 resolved, and `ACTUAL-SOFTWARE-ROADMAP-2026-08-11.md`'s Phase 6 exit evidence satisfied for all five apps. Nothing short of that is honestly "all problems," given how much this session already found that wasn't visible from documentation alone.
