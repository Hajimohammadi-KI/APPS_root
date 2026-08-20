# Animation review — DeutschFlow

## Verdict

**Approve.** Motion now matches the English app's restrained feedback system and respects reduced-motion preferences.

## Findings and fixes

- Repeated decorative Studio movement could distract during speaking. Infinite stage, coach, pulse, and waveform loops were removed or limited to short state feedback.
- Hover movement on dense learning cards was replaced with stable color/border/opacity feedback.
- The reduced-motion rule now shortens animations and disables smooth scrolling without globally erasing useful control feedback.
- Recording, evaluation, modal, and save states remain legible without using motion as the only signal.

## Verification

- TypeScript and lint exit 0.
- Targeted source searches found no prohibited high-frequency Studio loops, transitioned box shadows, broad reduced-motion transition overrides, or hover movement in the reviewed surfaces.
