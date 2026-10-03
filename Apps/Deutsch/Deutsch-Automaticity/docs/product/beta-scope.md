# Local parity release scope

## Included

- Responsive dashboard
- Grammar catalog and practice
- Seven-step daily automaticity plan
- Conversation studio with manual and supported speech input
- Evaluation and correction
- Error and review engine
- Guest/local mode
- Installable offline PWA
- Validated export, import, and deletion
- Exact embedded v20.8 fallback for regression checks

## Deferred

- Accounts and cross-device synchronization (the Supabase schema, RLS, RPCs,
  private audio bucket, and curriculum seed are prepared)
- Cloud audio backup and an offline synchronization outbox
- Payments
- Teacher dashboards
- Native mobile applications
- Generative avatars
- Automatic pronunciation scoring
- Public API
- Curriculum CMS
- LLM-based evaluation

## Product invariant

The rewrite is only feature-complete when it preserves the current controlled,
free-production, spoken-confirmation, repair, transfer, and spaced-review
learning gates.

The first release deliberately preserves the legacy local-first ownership
model. The prepared Supabase layer becomes active only when account-based
synchronization and explicit upload consent enter scope.
