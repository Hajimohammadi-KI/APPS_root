# Design QA — selective course/project highlighting

**Source visual truth path**

`C:\Users\Elahe\AppData\Local\Temp\codex-clipboard-b7f6133e-de12-4db2-8034-25980e093176.png`

**Implementation screenshot paths**

- `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version\outputs\course-related-red-v0.5.5\desktop-related-red.png`
- `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version\outputs\course-related-red-v0.5.5\desktop-unrelated-normal.png`
- `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version\outputs\course-related-red-v0.5.5\mobile-related-red-card-390-fixed.png`
- `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version\outputs\course-related-red-v0.5.5\production-related-red.png`
- Combined comparison: `D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version\outputs\course-related-red-v0.5.5\design-comparison.png`

**Viewport and normalization**

- Source: 3316 × 1316 px; CSS viewport and pixel density are unknown because this is a supplied screenshot.
- Desktop implementation: requested 1440 × 900 CSS px; captured browser content is 1380 × 891 px at device density 1.
- Mobile implementation: requested 390 × 844 CSS px; captured browser content is 375 × 812 px at device density 1.
- The source and implementation intentionally show different scroll states. The comparison therefore evaluates the preserved Study Tracker visual language and the requested selective red state, not pixel-for-pixel page composition.

**State**

- Route `/`, section `Gesamter Lernplan`.
- Course filter `Sitzung 1` selected.
- `NLP-Lab Integration 1` and `Woche 14` expanded.
- Two explicitly mapped project days visible with red state.
- Separate all-phases capture verifies `Design 1` has six normal/non-red days.

**Full-view comparison evidence**

- Existing purple course structure, cards, navigation, typography hierarchy and spacing remain visually consistent with the source screenshot.
- Red is added only to the two mapped project-day cards and their `Kursrelevant · Sitzung 1` chips.
- Unrelated Design 1 days retain their existing neutral or optional state colors.

**Focused-region comparison evidence**

- Desktop focused region: both mapped cards are fully visible, bordered red, and retain readable date, title, status and focus action.
- Mobile focused region: the red border and chip fit inside the 375 px content viewport with no horizontal overflow (`scrollWidth = clientWidth = 375`).
- No additional focused crop was needed because the affected cards and labels are legible in the saved desktop and mobile captures.

**Required fidelity surfaces**

- Fonts and typography: existing family, weights and hierarchy are preserved; the new chip uses the established compact label scale and remains readable.
- Spacing and layout rhythm: desktop card rhythm is unchanged; mobile chip now occupies its own wrapped row and does not collide with the date/status row.
- Colors and visual tokens: semantic red tokens (`--red`, `--red-soft`) clearly distinguish project-related course days without replacing existing optional/status colors.
- Image quality and asset fidelity: no image, logo, icon or other visual asset was changed or substituted.
- Copy and content: the chip identifies the exact related session number; no label is rendered for an unrelated day.

**Findings**

- No actionable P0, P1 or P2 finding remains.
- [P3] The supplied source is an ultra-wide overview while the implementation evidence is a focused plan state, so exact crop fidelity is not applicable to this scoped change.

**Comparison history**

1. Initial mobile pass found a P2 issue: the non-wrapping course chip was clipped at the right edge.
2. Fixed in `app/styles/90-responsive.css` by placing the chip on the wrapped summary row, constraining its width, and allowing line wrapping.
3. Post-fix evidence: `mobile-related-red-card-390-fixed.png`; chip right edge is 236.30 px inside a 375 px viewport, and page horizontal overflow is zero.

**Primary interactions tested**

- Opened `Lernplan`.
- Selected a course session filter.
- Expanded its mapped phase and week.
- Opened a mapped day at mobile width.
- Reset to all phases and verified an unrelated phase has zero red cards and zero course chips.

**Console errors checked**

- No browser warning or error entries were present after the tested interactions.
- The final production capture also contained no browser warning or error entries.

**Implementation checklist**

- [x] Red state derives only from explicit `relatedDayTitles` mappings.
- [x] Unrelated class/project days remain unmarked.
- [x] Desktop card labels are readable.
- [x] Mobile card labels wrap without overflow.
- [x] Source and implementation were reviewed together in one combined image.

final result: passed
