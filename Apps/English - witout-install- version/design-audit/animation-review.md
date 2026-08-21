# Animation review — English Automaticity

## Verdict

**Approve.** Motion is now restrained, task-focused, and compatible with reduced-motion preferences.

## Findings and fixes

- Repeated decorative Studio movement could compete with recording and evaluation. Infinite stage, coach, pulse, and waveform loops were removed or scoped to short state feedback.
- Hover movement on frequently used cards could make dense learning surfaces feel unstable. These interactions now rely on color, border, or opacity feedback without layout displacement.
- Broad reduced-motion overrides could erase useful button feedback. The universal rule now shortens animations and disables smooth scrolling, while 100 ms color/background/border feedback stays scoped to controls.
- Completion and save feedback remains visible, but no box-shadow transition or high-frequency loop is used as a primary state signal.

## Verification

- TypeScript and lint exit 0.
- Targeted source searches found no prohibited Studio pulse/wave/stage/coach infinite loops, transitioned box shadows, broad reduced-motion transition overrides, or hover movement in the reviewed surfaces.
