# 002 — Stop the always-moving coach

- **Status**: DONE
- **Commit**: 7d7de81
- **Severity**: HIGH
- **Category**: Restraint
- **Estimated scope**: 2 files, about 15 deleted lines

## Problem

The Conversation Studio coach floats forever and its halo continuously scales. This motion is decorative, competes with reading and speaking practice, and is present for the entire high-attention exercise.

```css
/* Apps/English/English-07082026/apps/web/app/studio/source/redesign.css:5 — current */
.coach-glow:before{...animation:coachGlow 3s ease-in-out infinite}
.coach-glow img{...animation:coachFloat 3.4s ease-in-out infinite}
@keyframes coachFloat{50%{transform:translateY(-6px) rotate(.4deg)}}
@keyframes coachGlow{50%{transform:scale(1.04);opacity:.8}}
```

```css
/* Apps/Deutsch-V10.08.2026/apps/web/src/app/studio/source/redesign.css:212-239 — current */
.coach-glow:before {
  /* ... */
  animation: coachGlow 3s ease-in-out infinite;
}
.coach-glow img {
  /* ... */
  animation: coachFloat 3.4s ease-in-out infinite;
}
```

## Target

The coach and radial halo remain visually identical but static. Remove both `animation` declarations and both now-unused keyframe blocks from each language app. Do not replace them with another decorative effect.

Functional motion remains unchanged: `.mic.recording` pulse and `.wave.live i` waveform continue only while recording because they communicate live system state.

## Repo conventions to follow

- Existing Conversation motion comments reserve animation for state feedback.
- `mic.recording` and `wave.live` are the correct examples of conditional, meaningful continuous motion; the coach is not conditional.

## Steps

1. Remove `animation: coachGlow 3s ease-in-out infinite` and the `@keyframes coachGlow` rule in English `redesign.css`.
2. Remove `animation: coachFloat 3.4s ease-in-out infinite`, its unused `transform-origin`, and the `@keyframes coachFloat` rule in English `redesign.css`.
3. Make the identical deletions in German `redesign.css` lines 219-239.
4. Search both app roots for `coachGlow|coachFloat`; expect zero matches.

## Boundaries

- Do NOT alter coach markup, image size, halo gradient, card layout, or instructional copy.
- Do NOT remove recording pulse or waveform animation.
- Do NOT add a replacement entrance animation.

## Verification

- **Mechanical**: run `rg -n "coachGlow|coachFloat" Apps/English/English-07082026/apps/web Apps/Deutsch-V10.08.2026/apps/web` and expect no matches. Run both web linters.
- **Feel check**: keep Conversation Studio open for at least 15 seconds in each app. Confirm the coach and halo are stable while the recording pulse and waveform still activate only during recording. Toggle reduced motion and confirm no coach movement appears.
- **Done when**: the coach never moves without a user/system state change and recording feedback remains functional.
