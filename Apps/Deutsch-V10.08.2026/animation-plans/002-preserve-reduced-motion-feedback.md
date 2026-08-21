# 002 — Preserve useful reduced-motion feedback

- **Status**: DONE
- **Commit**: cc0dee6
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 CSS file, one media query

## Problem

`apps/web/src/app/styles/101-reference-design.css:805-812` disables all
animation and reduces every transition to 0.01ms for mission descendants and
navigation. This suppresses useful state feedback and overrides the gentler
global pattern in `00-foundation.css`.

## Target

Remove movement while keeping fast feedback:

```css
.mission-home :where(button, a),
.nav-button,
.nav-group-trigger {
  transform: none !important;
  transition-property:
    opacity, color, background-color, border-color !important;
  transition-duration: 120ms !important;
  transition-timing-function: linear !important;
}
```

Keep `scroll-behavior: auto` only on `.mission-home`.

## Repo conventions to follow

- `apps/web/src/app/styles/00-foundation.css:260-279` keeps opacity feedback and
  drops movement for reduced motion.

## Steps

1. Replace the broad rule in `101-reference-design.css`.
2. Scope automatic scrolling to the mission root.

## Boundaries

- Do NOT add reduced-motion movement or alter visual layout.
- Do NOT add dependencies.

## Verification

- **Mechanical**: typecheck and lint pass.
- **Feel check**: with reduced motion enabled, buttons and nav retain 120ms
  color/opacity feedback while scale and translation stay off.
- **Done when**: the final reference layer no longer forces 0.01ms transitions.
