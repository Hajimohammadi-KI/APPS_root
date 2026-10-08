# Self-contained recovery audit

Date: 2026-08-07

## Authoritative application

`D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version2`

## Result

The current application contains the complete recoverable React/Next.js,
NestJS, database, migration, tracker, PDF-reader, Settings, Expose, NLP-lab,
test, and offline iPad-preview paths found in the previous repositories.
Nothing in the runtime, build, tests, or configuration reads from
`D:\APPS_root\deleted`.

The standard Shadcn configuration is valid. The Shadcn CLI resolves Next.js
16.2.6, React Server Components, TypeScript, Tailwind CSS v4, the `new-york`
style, Lucide icons, and the normal aliases. Three Shadcn primitives are
installed (`badge`, `button`, and `card`). Other tracker controls are existing
purpose-built accessible controls; a component count is not a missing-feature
indicator and unused UI primitives were not added.

## Recovery decision

- Current/newer files remain authoritative.
- Exact older source is isolated in `legacy/source-snapshots/` for inspection.
- Old build output, dependency folders, caches, logs, generated reports,
  runtime databases, and secret-bearing files were intentionally excluded.
- The canonical desktop HTML
  `StudyPlan_Cross_Repository_Code_Intelligence_V6_3_1.html` was not present in
  any inspected location, so exact canonical-desktop parity is still not a
  claim. This limitation does not prevent the current software from running.
