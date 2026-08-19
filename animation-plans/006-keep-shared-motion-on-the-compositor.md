# 006 — Keep shared motion on the compositor

- **Status**: DONE
- **Commit**: 753b841
- **Severity**: HIGH
- **Category**: Performance and frequency
- **Estimated scope**: 8–12 files, about 80 lines

## Problem

Two shared primitives still animate layout in the current English and German
applications. English Base UI Progress explicitly transitions the width that
Base UI writes inline, while both Accordion panels transition their measured
height on every expansion.

```tsx
// Apps/English/English-07082026/apps/web/components/ui/progress.tsx:24 — current
<ProgressPrimitive.Indicator className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:duration-100" />

// Apps/English/English-07082026/apps/web/components/ui/accordion.tsx:62 — current
className="h-(--accordion-panel-height) ... transition-[height,opacity] duration-200 ..."

// Apps/Deutsch-V10.08.2026/apps/web/src/components/ui/accordion.tsx:59 — current
className="h-(--accordion-panel-height) ... transition-[height,opacity] duration-200 ..."
```

Several frequently visited cards also transition `box-shadow` on hover. That
repaints large card surfaces for routine navigation. Confirmed locations
include both `styles/pages/daily-practice.css`, both
`styles/pages/dashboard-v2.css`, both `styles/pages/dashboard.css`, and both
`styles/99-visual-refresh-overrides.css` files.

## Target

1. All determinate shared Progress fills have `width: 100%`,
   `transform-origin: left center`, and represent the clamped percentage with
   `transform: scaleX(percentage / 100)`. Only transform transitions for
   `200ms cubic-bezier(0.23, 1, 0.32, 1)`. Under reduced motion it snaps.
2. Accordion content opens and closes without a height animation. Keep the
   chevron rotation at 150ms. Do not replace height with another layout
   property or a keyframe.
3. Remove `box-shadow` from transition property lists and remove hover-only
   shadow deltas on high-frequency learning cards. Static shadows remain.
   Existing gated 1px transform and border/color feedback may remain.

## Repo conventions to follow

- `--ease-out` is `cubic-bezier(0.23, 1, 0.32, 1)` in both foundations.
- Dashboard and Automaticity progress fills already use `scaleX(...)`; mirror
  those implementations.
- Hover movement must stay inside `@media (hover: hover) and (pointer: fine)`.

## Steps

1. In English `components/ui/progress.tsx`, destructure `min = 0`, `max = 100`,
   and `value`; compute a finite clamped ratio. Pass an inline style directly
   to `ProgressPrimitive.Indicator` with `width: "100%"` and the full
   `transform: scaleX(...)` string. Replace `transition-[width]` with
   `origin-left transition-transform duration-200` and
   `motion-reduce:transition-none`.
2. In German `components/ui/progress.tsx`, compute the same ratio in the root
   wrapper and pass the same direct style to the nested indicator. Preserve
   the exported component API and all labels/ARIA.
3. In both Accordion components, delete `transition-[height,opacity]`,
   `data-starting-style:h-0`, `data-ending-style:h-0`, and opacity start/end
   utilities from the panel. The content panel itself must not animate.
   Change the chevron to `duration-150`; reduced motion uses `duration-[0.01ms]`.
4. In the confirmed page/override CSS files, delete `box-shadow` from
   transition lists and delete shadow changes that exist only in hover rules.
   Do not remove static resting shadows.
5. Search both source trees for `transition-[width]`,
   `transition-[height`, `transition: width`, `transition: height`, and
   transition lists containing `box-shadow`; inspect and remove every
   remaining routine-card/layout match. Do not edit generated/public assets.

## Boundaries

- Do NOT change progress values, labels, geometry, ARIA, or colors.
- Do NOT change Accordion semantics, focus behavior, or open state.
- Do NOT remove static elevation from cards.
- Do NOT add dependencies or edit generated installer payloads.

## Verification

- **Mechanical**: in both app roots run web typecheck and lint. Searches for
  `transition-\[width\]|transition-\[height|transition:\s*(width|height)`
  must return no source motion matches. Inspect every remaining transitioned
  `box-shadow` and allow only a documented exceptional surface.
- **Feel check**: update Progress values in Dashboard/learning pages and confirm
  fills grow from the left without resizing the track. Open Accordions rapidly
  by mouse and keyboard; content must be crisp and the chevron must remain the
  only movement. At 10% playback, no card shadow may interpolate.
- **Done when**: routine motion uses transform/opacity only, Accordion panels
  perform no layout animation, and English/German behavior matches.
