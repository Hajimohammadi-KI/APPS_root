# 001 — Anchor select motion to its trigger

- **Status**: DONE
- **Commit**: cc0dee6
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 2 CSS files, 2 declarations

## Problem

`apps/web/app/styles/00-foundation.css:115` and
`apps/web/app/styles/100-apple-design.css:198` hard-code the popup origin:

```css
transform-origin: top center;
```

Dropdowns should scale from the Base UI trigger-derived origin so left- and
right-aligned menus do not appear to grow from the wrong point.

## Target

Use Base UI's existing origin variable with a safe fallback in both locations:

```css
transform-origin: var(--transform-origin, top center);
```

Keep the existing 160ms `opacity` and `transform` transitions unchanged.

## Repo conventions to follow

- Motion tokens already live in `apps/web/app/styles/00-foundation.css`.
- The popup is rendered by `apps/web/components/ui/select-menu.tsx` and already
  uses Base UI positioning; do not change its markup.

## Steps

1. Update the declaration in `00-foundation.css`.
2. Update the later visual override in `100-apple-design.css` so it does not
   overwrite the trigger-aware origin.

## Boundaries

- Do NOT change popup markup, duration, easing, size, or placement.
- Do NOT add dependencies.

## Verification

- **Mechanical**: `bun run --cwd apps/web typecheck` and
  `bun run --cwd apps/web lint` complete without errors.
- **Feel check**: open a left-aligned and a right-aligned select and confirm at
  slow playback that each popup expands from the trigger edge; rapid reopen
  must retarget smoothly.
- **Reduced motion**: confirm the popup keeps a 100ms opacity cue with no
  translate/scale movement.
- **Done when**: no English `.select-menu-panel` rule hard-codes an origin that
  overrides `--transform-origin`.
