# Language home — R66

Canonical presentation source for both apps. Run `bun scripts/sync-language-home.ts`
after editing here; `--check` verifies the deployable mirrors. Learner data remains
owned by each app and the existing read-only daily-dashboard subscription.

## Design decisions

UI UX Pro Max was queried for language-learning dashboard direction. Its initial
children's fonts/clay treatment and its subsequent generic AI marketing layout do
not fit this adult practice screen. Apply the skill's verified UI guidance instead:
one primary action, readable system typography, 44px targets, explicit empty/error
states, semantic colors, no decorative animation, focus visibility and responsive
reflow. Preserve the established warm paper/indigo identity. Use a system sans
stack (Segoe UI/Inter fallback); no new external font request. Body 16px, line-height
1.6; optional metadata at least14px. Keep natural German wrapping and Persian names
isolated with `bdi`; never uppercase learner text.

The metric-card composition was researched in **Stats cards with links**, by
Ephraim Duncan on 21st.dev:
https://21st.dev/@ephraimduncan/components/stats-cards-with-links/stats-cards-with-circular-progress
Adapt the value/label/link arrangement using original project code and existing
Lucide icons. Use a native progress element for an actual daily target instead of
copying its Recharts implementation. No registry installation, membership or
third-party source-code redistribution is claimed.

Hierarchy: greeting → recommended plan → current activity → optional practice
routes → saved evidence. A numbered learning process describes the method, not
unearned mastery. Due repairs/reviews remain selected by the existing engine.
Response counts measure activity, never speaking ability. Unknown or partially
unreadable histories show unavailable state, never zero-filled success.

Verification: both language variants at phone/tablet/desktop widths, keyboard
navigation, long names, empty/paused/repair/review states, correct links, no
horizontal overflow and unchanged data storage. See docs/language-apps-r66-validation.md.
