# Neon persistence

The web app remains fully usable offline without a database. This directory
contains the connected-mode schema required by the supplemental automaticity
specification.

Apply `migrations/001_automaticity.sql` to a Neon PostgreSQL database only after
an authentication provider has been selected. `app_users.external_subject`
stores that provider's stable user identifier; the Nest API must derive it from
a verified session or token and must never accept an arbitrary user ID from a
browser request.

Neon does not provide Supabase `auth.users`, Row Level Security identity
helpers, or file storage. The Supabase SQL in `Langauge.md` was therefore
translated into ordinary PostgreSQL tables. Authorization remains a Nest
service responsibility, while audio binaries stay local until an object-storage
and retention policy is selected.
