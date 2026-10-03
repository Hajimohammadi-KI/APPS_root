# Supabase persistence and synchronization foundation

The application continues to run anonymously and offline with localStorage and
IndexedDB. The Supabase files add an opt-in, authenticated persistence layer;
they do not make a network connection or upload a learner's data by default.

## Included database foundation

- `supabase/migrations/202607280001_automaticity_foundation.sql` creates the
  catalog, learner status, immutable attempts, audio metadata, raw and
  aggregated errors, review queue/events, and seven-step daily path.
- `supabase/seed.sql` contains the same 84 grammar units and 79 speaking topics
  that ship in `packages/content`.
- `bun run db:seed:generate` regenerates the seed deterministically from the
  versioned curriculum. The generated file must be refreshed whenever the
  curriculum changes.
- The private `automaticity-audio` Storage bucket accepts audio objects only
  below the authenticated learner's `<user-id>/...` folder.

Apply the migration to a Supabase project and then run the seed. Project URL,
anonymous key, service-role key, and database credentials are deployment
secrets and must not be committed.

## Security model

Catalog rows are read-only for authenticated learners. Every learner-owned row
is protected by Row Level Security. Indirect child rows (`attempt_errors` and
`daily_path_items`) verify ownership through their parent. Derived status,
aggregated errors, review events, and future review rows are not directly
writable from the browser.

The two browser-callable database functions are:

- `complete_review(review_id, client_event_id, success, accuracy)`
- `generate_daily_path(path_date)`

Both derive the learner from `auth.uid()`. Helper and trigger functions are not
callable by `anon` or `authenticated`.

## Offline idempotency

An offline client creates a UUID once for every attempt, error, audio metadata
record, and review completion, keeps that UUID in its outbox, and reuses it on
every retry. Unique `(user_id, client_event_id)` constraints make replay safe.
Review completion locks the queue row and records its event in the same
transaction before scheduling a successor.

Audio remains local unless the learner explicitly enables cloud backup.
`keep_local_only = true` deliberately has no Storage path.

## Automaticity gate

The database mirrors the domain rules. `automatic` requires:

- recognition at least 85;
- writing, speaking, and repair at least 80;
- transfer at least 75;
- at least two successful delayed topic reviews;
- no unresolved critical error;
- a median measured response latency of at most 8 seconds.

Scores are recalculated from immutable attempts using the same 60/40 rolling
update as the local domain model. A failed attempt is capped below a passing
score. Review intervals advance through 1, 3, 7, 14, and 30 days; failure moves
the learner back to a shorter interval.

## Application integration boundary

The current UI is intentionally still guest/local-first. Enabling account sync
requires Supabase project credentials plus an explicit sign-in and consent
flow. At that boundary, the sync adapter should:

1. keep local writes immediate;
2. enqueue immutable events with their existing client event IDs;
3. upload them after authentication and connectivity return;
4. treat database-derived mastery, error aggregation, and review scheduling as
   canonical;
5. never accept a user ID from a request body.
