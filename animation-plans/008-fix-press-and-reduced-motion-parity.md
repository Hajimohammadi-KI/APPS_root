# 008 — Fix press timing and reduced-motion parity

- **Status**: DONE
- **Commit**: 753b841
- **Severity**: HIGH
- **Category**: Timing and accessibility
- **Estimated scope**: 10 files, about 90 lines

## Problem

Shared Buttons and raw Studio buttons use the same 150–160ms duration while
pressing and releasing. English's default shared Button also moves upward on
every hover without a pointer gate. Reduced-motion handling is inconsistent:
English globally forces all feedback to `0.01ms`, Studio sets all animation and
transitions to `none`, and both Daily Practice styles remove every transition.

```tsx
// English components/ui/button.tsx:7, German equivalent:8 — current
... duration-150 ... active:scale-[.97]

// English components/ui/button.tsx:12 — current
... hover:bg-primary/90 hover:-translate-y-px

/* English styles/00-foundation.css:171-177 — current */
* { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }

/* Both Studio globals — current */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

## Target

- Shared press: deliberate press uses 150ms; release uses 100ms. Exact easing
  is `cubic-bezier(0.23, 1, 0.32, 1)`.
- Raw Studio press: active uses 160ms; release uses 100ms.
- Remove English default Button's hover translation; keep its color change.
- Reduced motion globally suppresses looping/keyframe movement and smooth
  scrolling, while scoped controls preserve opacity/color/background/border
  feedback for 100–120ms linear and remove transforms. Component-specific rare
  status/empty fades may remain at 120ms linear. Do not globally override
  `transition-property`, because that would break the mobile sidebar's required
  delayed `visibility` transition and Base UI Sheet exit lifecycle.

## Repo conventions to follow

- Both `100-apple-design.css` files already use a 120ms linear reduced-motion
  subset for common controls.
- Existing select and tooltip reduced-motion examples retain opacity while
  forcing transform to none.

## Steps

1. In both shared Button variants, change the base duration to 100ms and add
   `active:duration-150`. Preserve `active:scale-[.97]`. Remove only English
   `hover:-translate-y-px` from the default variant.
2. Apply the same asymmetric 100/150ms timing to shared Select triggers that
   scale on active. Do not animate highlighted options.
3. In both Studio CSS files, set raw `button` release duration to 100ms and set
   `button:not(:disabled):active` to `transition-duration: 160ms`.
4. In both foundation reduced-motion media queries, establish a global
   baseline for `*,*::before,*::after`: animation duration `0.01ms`, one
   animation iteration, and `scroll-behavior:auto`. Remove English's global
   `transition-duration:0.01ms`. Do not set a universal transition property or
   duration. Preserve/extend the scoped common-control rule in
   `100-apple-design.css` so buttons, selects, cards, and navigation controls
   use only opacity/color/background/border feedback for 120ms linear and force
   transform to none. Keep the mobile sidebar and Sheet's specific
   opacity/visibility reduced-motion rules authoritative.
5. Replace both Studio `animation:none/transition:none` universal blocks with
   the same 100ms color/opacity baseline. More-specific modal/status reduced
   fades must continue to override it.
6. Replace Daily Practice's `transition:none` reduced-motion rule with a 100ms
   linear border/background/color transition and `transform:none`.
7. Confirm all hover transforms left in source are inside
   `(hover: hover) and (pointer: fine)`; remove a transform rather than adding a
   broad gate when it is merely decorative/high-frequency.

## Boundaries

- Do NOT alter disabled, focus-visible, keyboard activation, or ARIA behavior.
- Do NOT remove comprehension-supporting opacity/color feedback.
- Do NOT add JavaScript media-query state or dependencies.
- Do NOT edit generated/public replacement assets.

## Verification

- **Mechanical**: both web typechecks and linters pass. Search active source for
  reduced-motion blocks containing `transition: none` or `animation: none` and
  inspect every remaining match; no common feedback surface may be fully
  silenced. Search ungated hover transforms.
- **Feel check**: hold and release shared buttons and Studio controls at 10%
  playback; press-in is slower than snap-back. Test touch emulation; English
  buttons must not remain lifted. Under reduced motion, colors/fades remain for
  100–120ms and all positional/scale movement is absent.
- **Done when**: timing is asymmetric, input-correct, and reduced-motion
  behavior is gentle rather than zero in both apps.
