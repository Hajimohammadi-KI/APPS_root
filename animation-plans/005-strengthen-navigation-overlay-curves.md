# 005 — Give navigation overlays a decisive curve

- **Status**: DONE
- **Commit**: 7d7de81
- **Severity**: HIGH
- **Category**: Easing, duration, and physicality
- **Estimated scope**: 2 files, about 20 lines

## Problem

Prominent navigation overlays use generic symmetric easing. German shared Sheets serve mobile navigation, reading settings, the user guide, and level selection; English uses a large mobile sidebar. These large entering/exiting surfaces feel weak and do not use the repo's strong overlay curves.

```tsx
// Apps/Deutsch-V10.08.2026/apps/web/src/components/ui/sheet.tsx:56 — current
"... transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 ..."
```

```css
/* Apps/English/English-07082026/apps/web/app/styles/90-responsive.css:73-76 — current */
transition:
  transform 180ms ease,
  opacity 180ms ease,
  visibility 180ms;
```

## Target

German Sheet content transitions only `transform` and `opacity` for 200ms with `cubic-bezier(0.32, 0.72, 0, 1)` (`--ease-drawer`). The overlay remains opacity-only for 150ms with `cubic-bezier(0.23, 1, 0.32, 1)`.

English mobile sidebar uses:

```css
transition-property: transform, opacity, visibility;
transition-duration: 200ms, 160ms, 0s;
transition-timing-function:
  var(--ease-drawer),
  var(--ease-out),
  linear;
transition-delay: 0s, 0s, 200ms;
```

The open state sets `transition-delay: 0s` so visibility becomes visible immediately on entry but remains visible until the 200ms exit finishes. Under reduced motion, remove translation and retain an opacity-only 100ms linear fade.

## Repo conventions to follow

- Both apps define `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` and `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- German Base UI uses `data-starting-style` and `data-ending-style` for interruptible open/close transitions.
- Existing shared select panels demonstrate reduced-motion opacity-only feedback.

## Steps

1. In German `sheet.tsx`, replace generic `transition duration-200 ease-in-out` with explicit transform/opacity transition utilities using the exact drawer curve. Keep every side-specific start/end transform unchanged.
2. Add reduced-motion utilities so starting/ending transforms are neutralized and the Sheet uses opacity-only 100ms linear feedback. Preserve the existing 150ms overlay fade, but give it the exact `ease-out` curve and reduced-motion 100ms linear duration.
3. In English `90-responsive.css`, replace the generic shorthand with the exact property/duration/timing/delay lists above. Add `transition-delay: 0s` to `[data-open="true"]`.
4. In an existing English reduced-motion media query or a new local one, set the closed/open sidebar transform to `none`, transition opacity for 100ms linear, and retain delayed `visibility` on close so it does not vanish before the fade.

## Boundaries

- Do NOT change overlay geometry, distances, z-index, breakpoints, navigation state, focus trapping, backdrop appearance, or close behavior.
- Do NOT add dependencies.
- Do NOT use `ease`, `ease-in`, `ease-in-out`, or `transition: all` in the changed declarations.
- If Tailwind cannot express a reduced-motion data variant exactly, use a small colocated CSS rule; do not omit the requirement.

## Verification

- **Mechanical**: run both web typechecks and linters. Search the changed declarations and confirm no generic easing or transition-all remains.
- **Feel check**: open and close the English mobile menu and every German Sheet side used by the app. At 10% playback, entry must decelerate decisively and exit must remain visible through its final frame. Rapidly alternate open/close; motion must reverse without jumping. Under reduced motion, confirm opacity-only 100ms feedback with no translation.
- **Done when**: navigation overlays use exact repository curves, transition only transform/opacity/visibility, remain interruptible, and respect reduced motion.
