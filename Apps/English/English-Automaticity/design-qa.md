# Conversation Studio compact-window design QA

- Source visual truth: user-provided screenshot in the current conversation (1264 x 822 PNG including Windows title bar; the client did not expose a filesystem path).
- Implementation screenshot: `test-results/design-qa-studio-1266x813.png`
- Viewport: 1266 x 813 CSS pixels
- Source pixels: 1264 x 822 including approximately 30 pixels of Windows title bar
- Implementation pixels: 1266 x 813 at device scale factor 1
- Normalization: compared the app-owned content at the same compact desktop width; Windows title-bar chrome was excluded from layout judgments.
- State: `/studio`, Level All, Skill All, Category Law, topic `Regulation, proportionality and unintended effects`, Guided conversation, Answer step.

## Full-view comparison evidence

The source screenshot showed a four-field filter occupying five grid tracks, a
two-column workspace compressed beside the sidebar, step labels leaving their
button bounds, evidence copy clipped in a narrow rail, and the fixed Reading
ruler covering header actions. In the final capture, the filter uses all four
tracks, selectors remain one line, the workspace reflows to one column before
it becomes cramped, every step stays inside the step bar, the full C2 title is
visible in the topic heading, and the Reading ruler has reserved header space.

Automated browser measurements at the target viewport confirmed:

- document horizontal overflow: 0 pixels
- tracked regions outside the viewport: 0
- step buttons with internal overflow: 0
- visible filter columns: 4
- visible workspace columns: 1
- browser console errors: 0

## Focused-region comparison evidence

The filter, practice-mode cards, seven-step bar, long C2 heading, coach panel,
and fixed Reading ruler are all readable in the implementation screenshot.
These were the affected above-the-fold regions, so no additional crop was
needed.

## Required fidelity surfaces

- Fonts and typography: existing Inter/Arial hierarchy and weights are preserved. Long selector text truncates with an ellipsis instead of wrapping outside its 48-pixel control; the full title remains available immediately below. Step labels no longer split outside their buttons.
- Spacing and layout rhythm: the existing margins, card radii, shadows, and purple hierarchy are preserved. The compact desktop breakpoint now moves evidence below the studio instead of narrowing both columns beyond their usable minimum.
- Colors and visual tokens: no palette or semantic color changes were made.
- Image quality and assets: the supplied Ava coach asset, crop, sharpness, and scale are unchanged; no placeholder or replacement asset was introduced.
- Copy and content: all app-specific wording is unchanged. Only native select rendering uses visual ellipsis for the long C2 topic, while its complete text remains in the option and the page heading.

## Comparison history

1. Initial source finding: P1 compact-window collision. A global responsive rule used `!important` to retain two workspace columns at 1266 pixels, overriding the Studio breakpoint. The filter also allocated five columns for four controls.
2. First implementation measurement: filter columns, bounding boxes, document width, and step overflow passed, but the workspace still reported two columns. Fixed the Studio breakpoint with an explicit scoped `!important` override.
3. Second measurement: all layout checks passed. Console validation was initially contaminated by the already-running installed desktop API on port 4201, whose CORS origin was 3202. The app process started for QA was closed and the isolated test server was rerun.
4. Final measurement and screenshot: all compact-window layout assertions and the clean-console assertion passed.

## Findings

No actionable P0, P1, or P2 findings remain at the reported desktop viewport.

## Follow-up polish

No P3 change is required for the requested overflow repair.

final result: passed
