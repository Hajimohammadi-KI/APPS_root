# NOT archived — supported companion

**Status resolved 1 September 2026. This label supersedes the generic archive
notice this file originally carried.**

Investigation for the archive plan's content inventory (step 2) found that
this directory is not a duplicate of the canonical English app at all. It is
**LingoBridge**, an original local-first browser extension (German/Persian/
English flashcards, spaced repetition) that explicitly integrates with the
German app, English app, and project tracker — see its own `README.md`. It
was grouped into the duplicate-prototype archive list in
[`docs/CANONICAL-APP-MAP.md`](../../../docs/CANONICAL-APP-MAP.md) by mistake.

Nothing here has been deleted (only its gitignored `node_modules` cache was
cleared, which `bun install` regenerates). LingoBridge is retained as a
supported local-first browser-extension companion. It is independently
buildable, but it is not a sixth Starter/Vercel release target and must not be
counted as one of the five canonical products. Its owner and review cadence are
recorded in [`docs/CANONICAL-APP-MAP.md`](../../../docs/CANONICAL-APP-MAP.md).
