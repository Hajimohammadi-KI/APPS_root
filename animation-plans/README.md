# Animation improvement plans

Audit commit: `7d7de81`

| Number | Plan | Severity | Status |
| --- | --- | --- | --- |
| 001 | Move progress bars onto the compositor | HIGH | DONE |
| 002 | Stop the always-moving coach | HIGH | DONE |
| 003 | Gate hover movement to real pointers | MEDIUM | DONE |
| 004 | Make word-help tooltips fast and reversible | HIGH | DONE |
| 005 | Give navigation overlays a decisive curve | HIGH | DONE |
| 006 | Keep shared motion on the compositor | HIGH | DONE |
| 007 | Make Conversation recording feedback calm and truthful | HIGH | DONE |
| 008 | Fix press timing and reduced-motion parity | HIGH | DONE |
| 009 | Add shared learning-feedback transitions | MEDIUM | DONE |
| 010 | Emphasize verified results and genuine mastery | MEDIUM | DONE |

## Recommended execution order

1. `002-stop-decorative-coach-motion.md` — isolated deletion with the smallest regression surface.
2. `005-strengthen-navigation-overlay-curves.md` — shared overlay primitives before page-level polish.
3. `004-make-word-help-interruptible.md` — the most stateful change; verify its timers independently.
4. `001-transform-progress-bars.md` — paired CSS/React change that needs runtime verification.
5. `003-gate-hover-motion.md` — broad but mechanical source cleanup after core motion is stable.
6. `006-keep-shared-motion-on-the-compositor.md` — remove remaining layout and paint animation before adding polish.
7. `008-fix-press-and-reduced-motion-parity.md` — establish final timing and accessibility behavior.
8. `007-calm-conversation-recording-motion.md` — simplify the highest-attention workflow.
9. `009-add-shared-learning-feedback-transitions.md` — reuse the stabilized motion foundation.
10. `010-emphasize-verified-results-and-mastery.md` — add restrained rare-state acknowledgement last.

The plans have no code dependency on one another, but execute them in this order so each verification step remains easy to isolate. After all five, run the combined English and German checks and review the final diff against `review-animations/STANDARDS.md`.
