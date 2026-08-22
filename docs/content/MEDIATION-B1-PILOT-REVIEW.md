# B1 mediation pilot review protocol

Status: awaiting independent human review

Rubric version: `1.0.0`

Agreement method: quadratic weighted Cohen's kappa

Release threshold: `kappa >= 0.60`

## Scope

The pilot contains one English and one German authored B1 mediation item. The
items are not open-dataset imports and no raw dataset is bundled with either
application. Their source IDs, content versions, language, CEFR level and
license are explicit in:

- `Apps/English/English-07082026/packages/content/src/mediation-b1-pilot.ts`
- `Apps/Deutsch-V10.08.2026/packages/content/src/mediation-b1-pilot.ts`

Both exported `released*` arrays must remain empty until this protocol passes.

## Independent review

Use exactly two independent reviewers per item. Across the pair, the roles
must cover:

1. a native speaker of the item language;
2. a language-pedagogy reviewer familiar with CEFR B1 productive tasks.

Store only pseudonymous reviewer IDs. Do not store names, email addresses or
learner data in the repository. Each reviewer scores these fixed criteria from
1 (fails) to 4 (strong):

- naturalness;
- CEFR B1 fit;
- mediation-task validity;
- cultural safety.

Each score must be at least 3 and both decisions must be `approve`. A decision
disagreement or a two-point criterion difference requires a separate,
documented adjudication. An LLM may suggest wording but cannot be a reviewer,
adjudicator or source of approval.

## Release procedure

1. Record both reviews in the item's `quality.reviews` array.
2. Add adjudication only when the disagreement rule requires it.
3. Set `quality.status` and `provenance.humanReviewed` to approved/true only
   after the evidence exists.
4. Run `bun run test:content-quality` in `shared/learning-core`.
5. Run the content type-check and content test in both applications.
6. Verify that the computed agreement passes and that no novel-transfer prompt
   leaks a six-token phrase from the source.
7. Only then may the item appear in a daily-plan selector.

Until steps 1-6 are complete, learning outcome and inter-rater agreement are
`N/A — not sufficiently verified`, not zero and not a successful result.
