# ADR 0001: Bun, TypeScript 7, Next.js, and NestJS

- Status: accepted
- Date: 2026-07-27

## Context

The v20.8 product is a static PWA whose markup, content, state, learning rules,
and browser integrations live in one HTML file. The rewrite requires a React
frontend and an independently deployable backend while preserving offline use.

## Decision

- Use Bun for workspaces, dependency management, script execution, the runtime,
  and unit tests.
- Use TypeScript 7.0.2 with strict checking.
- Keep TypeScript 6 under the `typescript` dependency name only for tools that
  still require the legacy compiler API. All project type-check and emit scripts
  invoke TypeScript 7 through the `@typescript/native` alias, following the
  TypeScript team's side-by-side transition guidance.
- Use Next.js App Router and React for `apps/web`.
- Use NestJS for `apps/api`.
- Keep framework-independent rules in shared packages.
- Use Supabase Postgres, Auth, and Storage once authenticated synchronization is
  introduced; preserve anonymous local-first use as the default.
- Keep curriculum content in versioned source until a real editorial workflow
  requires a CMS.
- Keep audio local by default and use object storage rather than Postgres for
  optional cloud backup.

## Consequences

The web and API can deploy independently, but authentication and contracts must
be handled deliberately. The monorepo must prevent framework imports from
leaking into the domain package. Bun compatibility is verified in CI rather
than assumed.
