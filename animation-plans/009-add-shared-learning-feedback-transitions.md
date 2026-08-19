# 009 — Add shared learning-feedback transitions

- **Status**: DONE
- **Commit**: 753b841
- **Severity**: MEDIUM
- **Category**: Feedback and preventing jarring change
- **Estimated scope**: 10 files, about 100 lines

## Problem

High-value conditional feedback still teleports into place: mixed-practice
correct/incorrect results, session-complete views, Teacher save confirmations,
and Settings export confirmations. The same seams exist in both languages.

```tsx
// English app/practice/page.tsx:193; German equivalent:222 — current
{correct === null ? <Button ... /> : <div className="space-y-3">...</div>}

// English app/teacher/page.tsx:60; German equivalent:173-177 — current
{message ? <p className="teacher-message" role="status">...</p> : null}
```

## Target

Add three CSS-only, interruptible utilities to both foundations:

```css
.shared-feedback-enter {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 140ms var(--ease-out), transform 140ms var(--ease-out);
}
.shared-status-enter {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 160ms var(--ease-out), transform 160ms var(--ease-out);
}
.session-complete-enter {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out);
}
@starting-style {
  .shared-feedback-enter { opacity: 0; transform: translateY(4px); }
  .shared-status-enter { opacity: 0; transform: translateY(-4px); }
  .session-complete-enter { opacity: 0; transform: translateY(6px); }
}
```

Under reduced motion all three force `transform:none`; feedback/status use a
100ms linear opacity transition and session completion uses 120ms.

## Repo conventions to follow

- Shared Select already uses interruptible transitions and `@starting-style`.
- `--ease-out` is the exact strong curve in both foundations.
- Correct and incorrect feedback use identical motion; color/copy carries the
  semantic difference.

## Steps

1. Add the exact three utilities and reduced-motion variants to both
   `styles/00-foundation.css` files.
2. Add `shared-feedback-enter` to the mounted result wrapper in English Mixed
   Practice and German Gemischtes Training. Preserve button/result logic.
3. Add `session-complete-enter` to the top-level completed-session wrapper in
   both pages.
4. Add `shared-status-enter` to English/German Teacher save messages and
   English/German Settings export statuses. Preserve `role="status"` and
   `aria-live`.
5. Add `shared-feedback-enter` only to existing conditionally mounted,
   user-requested evaluation results in German material practice and equivalent
   English learning feedback when the exact same seam exists. Do not animate
   live transcripts, timers, typing, list navigation, or every card.

## Boundaries

- Do NOT change scoring, queue, save/export, or teacher-content logic.
- Do NOT stagger frequent answer feedback.
- Do NOT use keyframes, animate layout properties, or add dependencies.
- Do NOT add the utility to every `role="status"`; only the cited conditional
  user-action responses.

## Verification

- **Mechanical**: both web typechecks and linters pass. Confirm the utilities
  exist once per foundation and every cited conditional surface uses one.
- **Feel check**: answer several mixed-practice items rapidly; feedback must be
  visible immediately and settle within 140ms. Complete a session and save
  Teacher/Settings data. At 10% playback there is no double exposure. Under
  reduced motion there is a short fade and no travel.
- **Done when**: the same state transitions feel consistent in both languages
  without animating routine navigation.
