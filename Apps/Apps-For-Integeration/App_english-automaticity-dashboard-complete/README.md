# English Automaticity — Compact Dashboard

A responsive implementation of the supplied compact dashboard reference.

## Included outputs

- `app/`, `components/`, and `lib/`: Next.js 16, React 19, TypeScript 7 source.
- `components/ui/`: source-owned Shadcn-style primitives.
- `standalone/index.html`: a dependency-free single-file version.
- `integration/`: the current responsive Home dashboard copied exactly from the active English application, including its page-scoped CSS and connection notes.

## Run with Bun

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Run with npm

```bash
npm install
npm run dev
```

## Production checks

```bash
npm run typecheck
npm run build
```

## Interactions

- Responsive navigation drawer
- Reading ruler
- Practice progress updates
- Weekly mission toggles
- Quick-launch feedback
- Responsive desktop, tablet, and mobile layouts

No database or backend is required for this visual dashboard prototype. The state is intentionally local and can later be connected to an API or Neon database.
