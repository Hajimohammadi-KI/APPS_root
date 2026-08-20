# 003 — Stabilize high-frequency navigation and cards

- **Status**: DONE
- **Commit**: cc0dee6
- **Severity**: LOW
- **Category**: Purpose, frequency & performance
- **Estimated scope**: 1 CSS file, one shared override block

## Problem

The Apple layer persistently applies `will-change: transform` to frequent
controls at `apps/web/src/app/styles/100-apple-design.css:162-170` and lifts all
cards on hover at `apps/web/src/app/styles/100-apple-design.css:225-229`.
Daily practice cards also lift in `styles/pages/daily-practice.css`.

This repeated movement is unnecessary in a crisp learning dashboard, and
persistent compositor promotion is wasteful.

## Target

Add final overrides in the approved reference layer:

```css
:where(
  [data-slot="button"],
  .select-menu-trigger,
  .german-sidebar-trigger,
  .german-app-sidebar nav a
) {
  will-change: auto;
}

@media (hover: hover) and (pointer: fine) {
  .german-app-main
    :where(.learning-card, [data-slot="card"], .daily-activity-card):hover {
    transform: none;
  }
}
```

Keep color/border hover cues and active press feedback.

## Repo conventions to follow

- Add overrides to `apps/web/src/app/styles/101-reference-design.css`.
- Retain the existing `scale(0.97-0.975)` press response.

## Steps

1. Neutralize persistent `will-change` in the final layer.
2. Gate the no-translation hover override behind pointer capability.

## Boundaries

- Do NOT remove focus rings, active feedback, color, or border cues.
- Do NOT change layout, shadows, or radii.

## Verification

- **Mechanical**: typecheck and lint pass.
- **Feel check**: sweep through nav and cards; surfaces stay spatially stable,
  while press feedback remains crisp at 80-160ms.
- **Done when**: frequent hover states no longer translate cards.
