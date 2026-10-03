# Implementation Plans

Generated on 2026-07-27 after a read-only survey of the unversioned v20.8
static PWA. Execute the roadmap by milestone and split each milestone into a
small pull request before implementation starts. Every executor must read the
full roadmap, honor its STOP conditions, and update the status row below.

## Execution order and status

| Plan                             | Title                                                   | Priority | Effort | Depends on | Status      |
| -------------------------------- | ------------------------------------------------------- | -------: | -----: | ---------- | ----------- |
| [001](001-production-roadmap.md) | Turn the static PWA into a production learning platform |       P1 |      L | —          | IN PROGRESS |

Status values: `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED: <reason>`,
`REJECTED: <reason>`.

## Dependency notes

Plan 001 is a phased roadmap rather than one pull request. Its internal order
is mandatory:

`baseline → domain/content extraction → Next.js shell → local feature parity → backend/Neon → offline sync/PWA → hardening → beta`

Do not begin the backend migration before the domain state machines and legacy
characterization tests exist. Do not remove the static v20.8 application until
the new application passes the parity suite and the legacy-data import test.

## Findings considered and rejected

- **A full Nuxt frontend plus React/shadcn**: rejected because Nuxt is a Vue
  framework and conflicts with the stated React/Next.js frontend requirement.
- **A Nuxt backend**: superseded by the user's explicit NestJS decision.
  `apps/api` is now a separate Nest service, while learning rules remain in
  framework-independent packages.
- **Putting the static grammar catalog in Postgres immediately**: rejected.
  The 84 grammar units and 79 topics are versioned product content and must
  continue to ship offline. Keep them in a typed content package until an
  editor/CMS is a real requirement.
- **Storing audio blobs in Neon/Postgres**: rejected. Keep only metadata and
  object-storage keys in Postgres; store audio in S3-compatible object storage
  when cloud backup is enabled.
- **Adding LLM scoring before preserving current behavior**: deferred. The
  current app already combines LanguageTool with deterministic target-grammar
  checks. First create a provider interface, test corpus, timeout policy, and
  cost/privacy boundary.
- **Payments, teacher dashboards, social features, native mobile apps, and a
  content CMS**: outside the first production beta. None is required to prove
  the current automaticity loop.
