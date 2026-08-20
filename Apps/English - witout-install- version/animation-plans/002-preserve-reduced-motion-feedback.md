# 002 — Preserve useful reduced-motion feedback

- **Status**: DONE
- **Commit**: cc0dee6
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 CSS file, one media query

## Problem

`apps/web/app/styles/101-reference-design.css:805-812` applies this broad rule:

```css
.mission-home *,
.nav-button,
.nav-group-trigger {
  animation: none !important;
  scroll-behavior: auto !important;
  transition-duration: 0.01ms !important;
}
```

It removes all state feedback for reduced-motion users and overrides the
gentler global pattern in `00-foundation.css`.

## Target

Drop movement while retaining a fast opacity/color cue:

```css
.mission-home :where(button, a),
.nav-button,
.nav-group-trigger {
  transform: none !important;
  transition-property: opacity, color, background-color, border-color !important;
  transition-duration: 120ms !important;
  transition-timing-function: linear !important;
}
```

Keep `scroll-behavior: auto` on the mission-home root. Do not disable every
animation on every descendant.

## Repo conventions to follow

- `apps/web/app/styles/00-foundation.css:205-257` is the canonical reduced-
  motion pattern: keep opacity/color, remove movement.

## Steps

1. Replace the broad descendant rule in `101-reference-design.css` with the
   scoped controls rule above.
2. Add `scroll-behavior: auto !important` only to `.mission-home`.

## Boundaries

- Do NOT add movement for reduced-motion users.
- Do NOT alter non-motion visual tokens or layout.
- Do NOT add dependencies.

## Verification

- **Mechanical**: typecheck and lint pass.
- **Feel check**: emulate `prefers-reduced-motion: reduce`; hover/focus/press a
  mission CTA and sidebar item. Color/opacity feedback should remain, while
  scale and translation are absent.
- **Done when**: the reference layer no longer sets all transitions to 0.01ms.
