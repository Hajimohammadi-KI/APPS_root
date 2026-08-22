# Optional implementation intentions

Status: implemented locally for English and German settings. Optional guarded
in-app delivery is documented separately in `GUARDED-IN-APP-NUDGES.md` and
remains off by default.

## Learner contract

- The setup is optional and starts empty.
- A saved configuration contains either no active plans or 2–5 active plans.
- Trigger types are time, after-event, context, and feeling.
- Actions are full session, review only, short booster, and “skip is okay”.
- Every row has visible active and delete controls. Skipping has no penalty.
- English and German pages use LTR. Persian copy is provided with RTL metadata.
- Free-text values use `dir="auto"` and remain local unless the learner explicitly
  exports the local adherence profile in a future feature.

## Technical boundary

`matchIntention` is a pure normalized exact matcher. It does not schedule,
display, persist, or emit a nudge. The separate guarded adapter uses only
time-based intentions after explicit opt-in. `replaceImplementationIntentions` replaces
only the intention list and timestamp; it preserves the existing streak and
`nudgeOptIn` value. The existing measurement export rejects intention fields,
so free text cannot enter the research export.

The profile remains in the versioned `adherence-core-v1` local-storage record.
No backend, push service, email service, telemetry endpoint, or medical/ADHD
inference is connected.

## Verification evidence

- Pure unit tests cover 0/2–5 validation, invalid time, duplicate IDs,
  normalization, inactive plans, profile preservation, and EN/DE/FA copy.
- English and German Playwright tests use accessible roles and keyboard Enter,
  verify reload persistence and deletion, and assert that no nudge event key is
  created.
- The same E2E path has no horizontal overflow at 800×1280 and 412×915.
- English `bun run check` and production build pass.
- German lint, typecheck, tests, installer tests, schema tests, production build,
  and the changed-file Prettier check pass. Repository-wide `bun run verify`
  remains stopped by the pre-existing Windows line-ending formatting baseline;
  this limitation is not counted as a product success.
