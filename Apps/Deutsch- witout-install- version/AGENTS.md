# Repository instructions

## Toolchain

- Use Bun for dependency installation, scripts, tests, and local TypeScript
  execution. Do not add npm, pnpm, or yarn lockfiles.
- Use TypeScript 7 in strict mode. Public interfaces must not use `any`.
- Run `bun run verify` before declaring implementation work complete.

## Architecture

- `apps/web` is the Next.js App Router frontend.
- `apps/api` is the NestJS backend.
- `packages/domain` contains pure business rules and must not import React,
  Next.js, NestJS, browser globals, or database libraries.
- `packages/contracts` owns versioned API schemas.
- `packages/content` owns offline curriculum content.
- `legacy/v20.8-static` is reference data. Do not edit it during the migration.

## Frontend

- Prefer Server Components. Use Client Components only for browser APIs,
  interactive practice, and local/offline state.
- Build domain components by composing shadcn primitives. Avoid boolean-prop
  component APIs and avoid monolithic page components.
- Keep media and speech APIs behind capability-detected adapters with manual
  text fallbacks.

## Backend

- Validate every external payload.
- Never trust a user ID from a request body.
- Keep LanguageTool and database URLs server-side.
- Make offline writes idempotent with client-generated event IDs.

## Compatibility

- Preserve the existing 79 conversation topics, 84 grammar units, seven daily
  steps, controlled/free/spoken mastery gates, and 1/3/7/14/30-day reviews.
- Do not delete the legacy app until parity and migration tests pass.
