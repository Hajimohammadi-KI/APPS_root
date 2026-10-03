# R66 — home-page design and verification

User confirmed both English Automaticity and DeutschFlow on2026-10-03.
Production release2026.10.03.11 remains current until the canonical release check.

## Findings and changes

- Replaced the repeated home start action with one prominent adaptive-plan link.
- Replaced ambiguous performance/legacy-threshold numbers with saved responses,
  due reviews and pending repairs from the existing evidence store.
- Replaced a large empty line chart with an explicit first-practice empty state.
  Nonempty weekly activity has exact counts, dates and proportionate bars.
- Removed the permanently visible notification dot, disconnected search affordance
  and redundant profile controls; settings remain reachable through practice level.
- Retained saved-response access and detailed learning evidence in a disclosure.
- Preserved English/German spelling, German wrapping, Persian name isolation and
  learner reading preferences. Added phone gutters and44px+ actions.

UI UX Pro Max local skill and21st.dev provenance/selection decisions:
[design notes](../shared/language-home/README.md).
Canonical presentation is mirrored into the two existing projects, with an exact
mirror check; no external runtime, font or paid component dependency added.

## Verification completed

- Both app TypeScript checks passed.
- Six UI rendering regression tests,27 assertions: unreadable history, loading,
  pause/repair/review priority, activity above goal, names as escaped text and routes.
- English `bun run check` passed; German `bun run verify` passed including build.
- Independent code/React/TypeScript review approved with no remaining findings.
- Connected Chrome: German375CSSpx viewport, adaptive-plan navigation verified;
  actions measured at least44px; no horizontal document overflow. Existing local
  test responses remained visible. Phone gutters improved after visual inspection.

## Remaining during implementation

Final responsive/keyboard checks, English production build, canonical deployment
and release marker verification are still pending. A development hydration warning
identified extra `data-qb-installed` HTML attributes from a browser extension;
do not count that as a verified application defect or suppress app warnings to hide it.
