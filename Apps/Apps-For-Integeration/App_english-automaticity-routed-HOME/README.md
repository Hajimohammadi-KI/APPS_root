# English Automaticity — Compact Dashboard

A responsive implementation of the supplied compact dashboard reference.

## Included outputs

- `app/`, `components/`, and `lib/`: Next.js 16, React 19, TypeScript 7 source.
- `components/ui/`: source-owned Shadcn-style primitives.
- `standalone/index.html`: a dependency-free single-file version.

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

- Responsive navigation drawer with URL-based active states
- Real App Router destinations for Home, Practice, Conversation, Grammar,
  Resources, Integrated Skills, Evidence, Notebook, Vocabulary, and Settings
- Reading ruler
- Interactive Start Today action and weekly activity chart
- Responsive desktop, tablet, and mobile layouts

## Routes

| Route | Workspace |
| --- | --- |
| `/` | Home dashboard |
| `/practice` | Today’s Practice |
| `/conversation` | Conversation Studio |
| `/grammar` | Grammar Lab |
| `/resources` | Learning Resources |
| `/skills` | Integrated Skills |
| `/evidence` | Errors and Recordings |
| `/notebook` | Notebook & PDF Reader |
| `/vocabulary` | Vocabulary & Flashcards |
| `/settings` | Settings |

No database or backend is required for this routing phase. The route workspaces expose
the planned NestJS endpoints and are ready for the next Neon-backed integration phase.
