# 004 — Make word-help tooltips fast and reversible

- **Status**: DONE
- **Commit**: 7d7de81
- **Severity**: HIGH
- **Category**: Interruptibility and frequency
- **Estimated scope**: 4 files, about 90 lines

## Problem

The English and German word-help tooltips are used repeatedly while reading. Each new English target always waits 280ms and then runs a 150ms entrance, so consecutive lookups can take about 430ms. In both apps, `hide()` immediately unmounts the tooltip, which makes dismissal abrupt and prevents an entrance from reversing.

```tsx
// Apps/English/English-07082026/apps/web/features/components/contextual-hover-help.tsx:339-353 — current
const hide = () => {
  cancelPending();
  activeKey.current = "";
  setTooltip(null);
};
// ...
timer.current = setTimeout(() => {
  activeKey.current = next.key;
  setTooltip(next);
  pendingKey.current = "";
}, 280);
```

```tsx
// Apps/Deutsch-V10.08.2026/apps/web/src/components/german-hover-help.tsx:336-350 — current
const hide = () => {
  cancelPending();
  activeKey.current = "";
  setTooltip(null);
};
```

```css
/* Both app/styles/91-accessibility.css — current */
.persian-word-help-card {
  animation: persian-word-help-in 150ms ease-out;
}
@keyframes persian-word-help-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

## Target

- First pointer tooltip after an idle period: 280ms intent delay.
- Consecutive tooltip while the warm window is active: immediate.
- Warm window resets 500ms after the last tooltip closes.
- Enter: interruptible CSS transition, `opacity` plus 4px trigger-relative travel, 150ms `cubic-bezier(0.23, 1, 0.32, 1)`.
- Exit: reverse to opacity 0 plus 4px toward the trigger over 100ms, then unmount.
- Reduced motion: no travel, opacity-only 100ms linear; do not remove feedback.

Use `data-state="open|closing"` and `data-placement="above|below"`. Move the current anchoring transform into a custom property, for example `--word-help-anchor: translate(-50%, -100%)`, and compose the 4px visual offset after it in CSS. Use `@starting-style` for the mounted entrance; do not use keyframes.

## Repo conventions to follow

- Shared select panels already use interruptible transitions, `data-state="closing"`, `@starting-style`, and a short delayed unmount.
- Use `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` from the foundation.
- Keep the English and German component state machines equivalent; retain their existing localized content and focus behavior.

## Steps

1. In each tooltip component, add refs for the current tooltip, 100ms exit timer, 500ms warm-window timer, and whether the warm window is active. Add a `closing` state.
2. Update `hide()` to cancel pending intent work, set `data-state` to closing, wait 100ms, then unmount and start the 500ms warm-window reset. Ensure a newly scheduled tooltip cancels an in-progress exit and can reuse the mounted surface.
3. Update `schedule()` so the first target waits 280ms but targets during the warm window show immediately. Preserve the duplicate-key guards and mouse-only pointer behavior.
4. Render `data-state`, `data-placement`, and the anchor custom property. Do not keep the anchor in the inline `transform`, because CSS must compose and transition the visual offset.
5. In both `91-accessibility.css` files, replace the keyframe with `opacity`/`transform` transitions, `@starting-style`, and closing-state rules. Above tooltips travel down toward their trigger; below tooltips travel up toward their trigger. Remove the unused keyframe.
6. Replace `animation: none` in the reduced-motion block with an opacity-only 100ms linear transition and force the visual offset to zero while preserving the anchor transform.
7. In effect cleanup, clear intent, exit, and warm timers.

## Boundaries

- Do NOT change tooltip content, glossary matching, positioning bounds, mouse-only pointer filter, focus access, role, language, or ARIA IDs.
- Do NOT add a dependency or animation library.
- Do NOT make every pointer movement immediately show the first tooltip; keep the 280ms intent threshold.
- Do NOT allow a stale exit timer to unmount a newer tooltip.

## Verification

- **Mechanical**: run both web typechecks and linters. Existing tooltip-related tests must pass; add focused fake-timer tests if a nearby test harness already exists. Search for `persian-word-help-in` and expect zero matches.
- **Feel check**: in each app, hover one eligible word and verify the initial 280ms delay. Move directly to a second eligible word and verify it appears immediately. Leave and re-enter within 500ms; it remains immediate. Wait more than 500ms; the initial delay returns. At 10% playback, confirm enter and exit reverse cleanly toward the trigger. Under reduced motion, confirm a 100ms fade remains with no travel.
- **Done when**: rapid target changes never restart a keyframe, exit is visible and cancellable, no stale timer removes current content, and both apps behave identically.
