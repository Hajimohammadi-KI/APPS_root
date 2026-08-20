# 003 — Stabilize high-frequency navigation and cards

- **Status**: DONE
- **Commit**: cc0dee6
- **Severity**: LOW
- **Category**: Purpose, frequency & performance
- **Estimated scope**: 1 CSS file, one shared override block

## Problem

The inherited Apple layer keeps `will-change: transform` on common buttons and
navigation (`apps/web/app/styles/100-apple-design.css:170-173`) and lifts every
card on hover (`apps/web/app/styles/100-apple-design.css:215-219`). Daily cards
also move at `apps/web/app/styles/pages/daily-practice.css:147-150`.

These are high-frequency dashboard interactions. Repeated movement adds noise,
and persistent `will-change` reserves compositor resources unnecessarily.

## Target

In the final reference layer, neutralize only persistent promotion and hover
translation while keeping border/color feedback and press feedback:

```css
:where([data-slot="button"], .select-menu-trigger, .nav-group-trigger, .nav-button) {
  will-change: auto;
}

@media (hover: hover) and (pointer: fine) {
  .app-content :where(.learning-card, [data-slot="card"], .daily-activity-card):hover {
    transform: none;
  }
}
```

## Repo conventions to follow

- Add final overrides to `apps/web/app/styles/101-reference-design.css`, which
  intentionally owns the approved white-violet visual layer.
- Retain the existing `scale(0.975)` press feedback from the Apple layer.

## Steps

1. Add the `will-change: auto` override near shared control styles.
2. Add the pointer-capability-gated no-translation hover override.

## Boundaries

- Do NOT remove focus rings, active press feedback, or color/border changes.
- Do NOT change card layout, shadows, or radii.

## Verification

- **Mechanical**: typecheck and lint pass; search confirms no effective hover
  translation on the shared cards.
- **Feel check**: move quickly through nav and daily cards. Surfaces stay
  spatially stable; press feedback remains crisp at 80-160ms.
- **Done when**: frequent hover states use color/border feedback without lift.
