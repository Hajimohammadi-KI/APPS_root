# 010 — Emphasize verified results and genuine mastery

- **Status**: DONE
- **Commit**: 753b841
- **Severity**: MEDIUM
- **Category**: State indication and rare delight
- **Estimated scope**: 6 files, about 80 lines

## Problem

Conversation evaluation data and save confirmation replace existing values
without a visual acknowledgement. The rare verified-CEFR mastery banner also
mounts instantly even though its source logic already ensures it represents a
genuine, infrequent achievement.

```tsx
// English Studio: feedback section around 649; German around 1374 — current
<section className="panel feedback">...</section>

// English Dashboard:163; German Dashboard:264 — current
{verifiedLevel ? <div className="home-v2-celebrate...">...</div> : null}
```

## Target

- A verified Conversation evaluation enters once with opacity and 4px upward
  travel in 160ms using `cubic-bezier(0.23, 1, 0.32, 1)`. Do not animate each
  metric separately or animate on every transcript character.
- A successful Conversation save remounts only the save heading with the same
  160ms acknowledgement. The daily-complete modal remains unchanged.
- A genuine verified-mastery banner enters with opacity,
  `translateY(6px) scale(0.98)` to identity over 240ms using the same curve.
  No confetti, looping sparkle, bounce, or stagger.
- Reduced motion uses opacity only: 100ms for Conversation and 120ms for the
  milestone.

## Repo conventions to follow

- Existing Studio error/status and modal motion already use 160/240ms
  `var(--ease-out)`.
- Dashboard verification state is evidence-gated. Do not weaken that gate or
  celebrate self-declared level changes.

## Steps

1. In both Studio components, key the feedback panel by
   `evaluation?.checkedAt ?? "pending"` and add
   `conversation-evaluation-enter` only when evaluation is non-null.
2. Key the save-stage `.flow-title` by `savedId ?? "unsaved"` and add
   `conversation-save-enter` only after a real `savedId` exists.
3. In both Studio CSS files, define both classes with interruptible transitions
   plus `@starting-style`: opacity 0 and `translateY(4px)` to identity in
   160ms. Add 100ms opacity-only reduced-motion rules.
4. Add `milestone-enter` to English `.home-v2-celebrate` and German
   `.home-v2-celebration` markup.
5. In both dashboard-v2 CSS files, define the 240ms opacity/transform
   transition and matching `@starting-style`. Reduced motion is 120ms
   opacity-only with transform none.

## Boundaries

- Do NOT change evaluation provider, scoring, WPM, save eligibility, IndexedDB,
  CEFR verification, or dismissal logic.
- Do NOT animate when evaluation is null/unavailable.
- Do NOT add confetti, looping icons, springs, or dependencies.
- Do NOT change the existing daily-complete modal timing.

## Verification

- **Mechanical**: both web typechecks and linters pass. Confirm no evaluation
  animation class is present when `evaluation` is null.
- **Feel check**: run one real or safely stubbed valid evaluation, then save.
  Each acknowledgement runs once and does not replay while typing. Trigger a
  genuine test milestone state and inspect at 10% playback; it stays crisp and
  under 300ms. Reduced motion keeps fade-only feedback.
- **Done when**: verified results are acknowledged once, invalid/unavailable
  states remain silent, and rare mastery receives restrained delight.
