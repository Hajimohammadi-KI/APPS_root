# 001 — Anchor select motion to its trigger

- **Status**: DONE
- **Commit**: cc0dee6
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 2 CSS files, 2 declarations

## Problem

`apps/web/src/app/styles/00-foundation.css:170` and
`apps/web/src/app/styles/100-apple-design.css:208` hard-code:

```css
transform-origin: top center;
```

This makes edge-aligned Base UI selects appear to grow from the wrong point.

## Target

Use Base UI's trigger-derived origin with a safe fallback in both files:

```css
transform-origin: var(--transform-origin, top center);
```

Keep the existing 160ms opacity/transform transitions unchanged.

## Repo conventions to follow

- Motion tokens live in `apps/web/src/app/styles/00-foundation.css`.
- `apps/web/src/components/ui/select-menu.tsx` already owns the Base UI markup.

## Steps

1. Update the foundation declaration.
2. Update the later Apple declaration so it does not overwrite the origin.

## Boundaries

- Do NOT change markup, duration, easing, size, or placement.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `bun run --cwd apps/web typecheck` and lint pass.
- **Feel check**: open edge-aligned selects at slow playback; each popup should
  expand from its trigger and rapid reopen should retarget smoothly.
- **Reduced motion**: opacity cue remains, movement is removed.
- **Done when**: no German `.select-menu-panel` rule overrides the Base UI
  origin with a hard-coded value.
