# 003 — Gate hover movement to real pointers

- **Status**: DONE
- **Commit**: 7d7de81
- **Severity**: MEDIUM
- **Category**: Accessibility and input correctness
- **Estimated scope**: 8 CSS files, about 60 lines moved or added

## Problem

Several frequently used cards and controls move on `:hover` without checking that the device has a fine hover-capable pointer. Touch browsers can synthesize or retain hover, leaving controls visually lifted after a tap.

```css
/* Apps/English/English-07082026/apps/web/app/styles/pages/conversation-studio.css:201-204 — current */
.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(27, 48, 83, 0.1);
}
```

```css
/* Apps/Deutsch-V10.08.2026/apps/web/src/app/styles/pages/dashboard.css:479-482 — current */
.daily-step:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgb(24 43 75 / 8%);
}
```

Other confirmed ungated movement appears in English `dashboard-v2.css:90`, `daily-practice.css:149`, `conversation-studio.css:373`, `dashboard.css:554`, and the legacy `studio/source/globals.css:2`; and German `dashboard-v2.css:493`, `daily-practice.css:117`, and `dashboard.css:371`.

## Target

Every hover rule that changes `transform` is contained in this exact media query:

```css
@media (hover: hover) and (pointer: fine) {
  .control-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(27, 48, 83, 0.1);
  }
}
```

Keep durations already in the valid 150-180ms range. Keep keyboard focus and `:active` press feedback outside the hover media query. Do not add hover movement where none exists.

## Repo conventions to follow

- English `99-visual-refresh-overrides.css:346` and German equivalent at line 408 already use `@media (hover: hover) and (pointer: fine)`.
- English `conversation-studio.css:510` already gates `.conversation-path-field:hover` correctly.
- German `studio/source/globals.css:84` already gates the base button hover correctly; preserve it.

## Steps

1. Wrap the cited English hover blocks in `@media (hover: hover) and (pointer: fine)` without changing their declarations.
2. In English legacy `studio/source/globals.css`, neutralize the earlier minified `button:hover` transform for non-hover inputs, while preserving the later gated `button:not(:disabled):hover` rule and the 160ms explicit transition-property override.
3. Wrap the cited German hover blocks in the same media query without changing their declarations.
4. Ensure `:active` scale feedback and `:focus-visible` styling remain outside hover-only media queries.
5. Re-scan every non-generated CSS file for `:hover` blocks containing `transform`; verify each is nested under the exact pointer gate. Do not edit `public/replacements` generated assets.

## Boundaries

- Do NOT change colors, shadows, travel distances, timing, focus styles, or active press behavior.
- Do NOT gate hover styles that only change color unless required to keep one existing block intact.
- Do NOT touch generated `public/replacements` assets.
- Do NOT add JavaScript pointer detection.

## Verification

- **Mechanical**: run both web linters and typechecks. Inspect all `:hover` + `transform` matches with `rg -n -U --glob '*.css' ':hover\\s*\\{[^}]*transform\\s*:'` and confirm each source match is within the pointer media query.
- **Feel check**: in browser device emulation with touch enabled, tap dashboard courses, daily cards, Conversation mode cards, and controls; none may remain translated. With a mouse, the same elements should lift 1-2px. Keyboard focus rings must remain visible and Enter/Space press feedback must still scale.
- **Done when**: no source hover transform runs on a coarse/non-hover pointer and desktop behavior is unchanged.
