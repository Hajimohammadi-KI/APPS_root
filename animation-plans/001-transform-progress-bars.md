# 001 — Move progress bars onto the compositor

- **Status**: DONE
- **Commit**: 7d7de81
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 6 files, about 30 lines

## Problem

The dashboard and Automaticity progress fills in both products animate `width`. Every update therefore performs layout and paint instead of staying on the compositor.

```css
/* Apps/English/English-07082026/apps/web/app/styles/pages/dashboard-v2.css:78 — current */
.home-v2-progress-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#ef9bb7,#9d84ed); transition: width 220ms cubic-bezier(.23,1,.32,1); }

/* Apps/Deutsch-V10.08.2026/apps/web/src/app/styles/pages/dashboard-v2.css:419 — current */
transition: width 220ms cubic-bezier(0.23, 1, 0.32, 1);
```

```tsx
// Apps/English/English-07082026/apps/web/features/screens/automaticity-screen.tsx:273-274 — current
className="h-full rounded-full bg-violet-700 transition-[width]"
style={{ width: `${Math.min(100, Math.max(0, value))}%` }}

// Apps/Deutsch-V10.08.2026/apps/web/src/features/automaticity/automaticity-lab.tsx:224-225 — current
className="h-full rounded-full bg-violet-700 transition-[width]"
style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
```

The same pattern occurs at English Automaticity lines 1174-1175, German Automaticity lines 1103-1104, English dashboard screen line 297, and German dashboard lines 568-569.

## Target

Every fill is always `width: 100%`, grows from the left edge, and represents its value with `transform: scaleX(value / 100)`. Animate only `transform` for `220ms` with `cubic-bezier(0.23, 1, 0.32, 1)`. Clamp every dynamic input to `0..100` before division.

```css
.home-v2-progress-track span {
  width: 100%;
  transform-origin: left center;
  transition: transform 220ms var(--ease-out);
}
```

```tsx
className="h-full origin-left rounded-full bg-violet-700 transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
style={{ transform: `scaleX(${Math.min(100, Math.max(0, value)) / 100})` }}
```

## Repo conventions to follow

- Both foundations define `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`.
- Shared dropdown motion in each `00-foundation.css` already limits transitions to `opacity` and `transform`.
- Keep English and German implementations structurally equivalent.

## Steps

1. In both `dashboard-v2.css` files, give the fill `width: 100%`, `transform-origin: left center`, and replace `transition: width ...` with `transition: transform 220ms var(--ease-out)`.
2. In English `dashboard-v2-screen.tsx` line 297 and German `dashboard.tsx` lines 568-569, replace inline `width` with a clamped `scaleX()` transform.
3. In both Automaticity files, replace both `transition-[width]` classes with the exact `origin-left transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]` classes and replace inline width with a clamped `scaleX()` transform.
4. Add `motion-reduce:transition-opacity motion-reduce:duration-100` only if a non-transform visual state already changes; otherwise use `motion-reduce:transition-none` so reduced-motion users do not see growth movement.

## Boundaries

- Do NOT change progress values, labels, ARIA, colors, or layout dimensions.
- Do NOT add a motion library or dependency.
- Do NOT edit generated installer payloads in this plan.
- If a cited line has drifted from the pattern above, STOP and report instead of improvising.

## Verification

- **Mechanical**: from each app root run `bun run typecheck` and `bun run --cwd apps/web lint`; both must exit 0. Run `rg -n "transition-\\[width\\]|transition:\\s*width" apps/web` and expect no progress-bar matches.
- **Feel check**: open Dashboard and Automaticity in both apps, change a progress value, and confirm the bar grows from the left without resizing its track. In DevTools at 10% playback, confirm only a smooth fill transform is visible. Toggle `prefers-reduced-motion` and confirm the fill snaps to its value without travel.
- **Done when**: all six progress implementations use `scaleX`, no changed element transitions a layout property, and English/German behavior matches.
