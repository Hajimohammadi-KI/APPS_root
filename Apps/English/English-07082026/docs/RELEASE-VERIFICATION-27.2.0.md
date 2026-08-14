# English Automaticity 27.2.0 Release Verification

Date: 2026-08-14  
Scope: Task Definition versioning, deterministic event upcasting, PostgreSQL lifecycle monitoring, installer alignment

## Automated source verification

- Frozen workspace install: passed.
- TypeScript checks for content, evidence domain, API, and web: passed.
- Domain/web/API tests: 60 passed, 0 failed.
- Installer contract tests: 6 passed, 0 failed.
- Production API and Next.js build: passed.
- Lint: passed with 12 existing warnings and 6 existing informational notices; no lint error.

The new focused coverage proves:

- allowed and forbidden lifecycle transitions;
- published replacement required for deprecation;
- exact historical Task Version resolution;
- highest published version resolution for new Attempts;
- deterministic V1-to-V2 upcasting;
- stored input is not mutated;
- legacy transcript provenance remains `legacy_unknown`;
- no speaking, pronunciation, or independent-recall eligibility is manufactured;
- missing upcaster chains fail closed;
- SQL contract includes locking, optimistic concurrency, immutable definitions, append-only events, actor attribution, duration views, stuck views, and a ledger-integrity view.

## Installer and runtime verification

Verification used isolated Install and Data roots under the repository. It did not use or modify the learner's normal application data.

| Check | Result |
|---|---|
| Fresh Install exit | `0` |
| Fresh installed version | `27.2.0` |
| Fresh executable present | yes |
| Fresh data marker preserved | yes |
| Update exit | `0` |
| Repair exit | `0` |
| Installed API `/api/health` | HTTP `200` |
| Installed Web `/` | HTTP `200` |
| Runtime processes observed | `6` |
| Data marker preserved after Update | yes |
| Data marker preserved after Repair | yes |
| Data marker SHA-256 | `EA82D196C4E5FB0A9023E70B7478AADAEEFF01932E816446EC5676E17DFE799A` |
| Runtime processes after Repair | `0` |

The disposable verification installations were removed after these results were recorded. They contained only generated program payloads and synthetic marker files; learner data was not involved.

## Release artifact

- Version: `27.2.0`
- Installer: `artifacts/windows-installer/EnglishGrammar-Setup-v27.2.0.exe`
- Installer SHA-256: `DD626407AE4903BB3F17ACF090F0A6639A4695D0A4F9860F2A7E35371448A3E5`
- Payload: `artifacts/windows-installer/EnglishGrammar-Setup-v27.2.0.payload.zip`
- Payload size: `240133572` bytes

## Deliberate limitation

`002_task_definition_versioning.sql` was not applied to a live PostgreSQL/Neon environment in this work. No target connection or approved deployment environment was supplied. The migration received source-level contract checks, but staging must still execute the SQL, transition fixtures, monitoring queries, permission checks, and rollback rehearsal before production deployment.

This release establishes the versioning and monitoring foundation. It does not switch the learner's Mastery projection and does not activate an `Automatic` claim from legacy evidence.
