# 007 — Make Conversation recording feedback calm and truthful

- **Status**: DONE
- **Commit**: 753b841
- **Severity**: HIGH
- **Category**: Purpose, performance, and cohesion
- **Estimated scope**: 4 files, about 70 lines

## Problem

Both Conversation Studios continuously animate a paint-heavy microphone shadow
and 58 synthetic waveform bars while recording. The waveform is not driven by
real input amplitude. Both apps also restart a stage-entry keyframe whenever a
learner clicks among the seven directly selectable steps.

```css
/* Both studio/source/globals.css — current */
.mic.recording { animation: pulse 1.2s infinite; }
@keyframes pulse {
  50% { box-shadow: 0 0 0 18px #e6defc; transform: scale(1.03); }
}
.wave.live i { animation: wave 0.6s ease-in-out infinite alternate; }
.flow-panel,
.improve-panel { animation: conversation-stage-enter 180ms var(--ease-out) both; }
```

## Target

- Recording state changes once, in 160ms, instead of moving forever.
- The microphone moves only with `transform: scale(1.015)` while recording.
- The waveform remains visually present but changes only opacity: base `0.42`,
  live `1`, with `opacity 160ms cubic-bezier(0.23, 1, 0.32, 1)`.
- The status pill changes background/color with the same 160ms curve and is
  announced politely.
- Direct Conversation step changes have no panel entrance animation. Keep the
  purposeful error and daily-completion modal motion.
- Reduced motion keeps 100ms color/opacity feedback and removes transforms.

## Repo conventions to follow

- Both Studio files already use `recordingState`, `audioUrl`, `.ready`, `.mic`,
  and `.wave.live` in equivalent structures.
- Keep the existing `--ease-out` fallback exactly:
  `cubic-bezier(0.23, 1, 0.32, 1)`.
- The seven-step learning state and evidence reset rules must not change.

## Steps

1. In both `studio-source.tsx` files, add `data-recording-state` to
   `.record-card`. Its value is `recorded` when `recordingState === "idle" &&
   audioUrl`, otherwise the exact `recordingState` value.
2. Add `aria-live="polite"` to `.ready`. Do not announce timer ticks or
   waveform decoration.
3. In both Studio CSS files, remove `.mic.recording`'s infinite animation and
   delete `@keyframes pulse`. Give `.mic` a transform transition of 160ms and
   set `.record-card[data-recording-state="recording"] .mic` to
   `transform: scale(1.015)`.
4. Remove all per-bar waveform animations, delays, and `@keyframes wave`.
   Transition only `.wave` opacity from `0.42` to `1` when `.live`.
5. Add state-specific `.ready` colors using existing variables: recording uses
   `var(--coral)` / `#a62720`, paused uses `var(--blue)` / `#263e87`, and
   idle/recorded keep `var(--mint)` / `#186a2d`.
6. Delete the `.flow-panel,.improve-panel` stage-entry animation and the now
   unused `conversation-stage-enter` keyframe. Keep `conversation-status-enter`
   and daily-complete backdrop/card animations unchanged.
7. Extend Studio reduced-motion rules so `.mic` has no transform and `.wave`
   and `.ready` retain opacity/color feedback for 100ms linear.

## Boundaries

- Do NOT change recording, SpeechRecognition, MediaRecorder, timer, evaluation,
  save, or topic-reset logic.
- Do NOT present synthetic bars as measured input.
- Do NOT remove error or completion modal motion.
- Do NOT add Web Audio, a motion library, or another dependency.

## Verification

- **Mechanical**: both web typechecks and linters pass. Searches for
  `@keyframes pulse|@keyframes wave|conversation-stage-enter` in active Studio
  CSS return zero matches.
- **Feel check**: trigger idle → recording → paused → resumed → recorded in each
  app. State changes must be immediate and calm, with no perpetual pulse or
  fake bar movement. Rapidly click step tabs; panels must not repeatedly fly
  in. With reduced motion, the status color/fade remains and no transform runs.
- **Done when**: recording state is unmistakable without continuous decorative
  motion or paint-heavy animation, and both languages behave identically.
