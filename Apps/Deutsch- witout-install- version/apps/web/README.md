# DeutschFlow web

Next.js App Router frontend for the German grammar automaticity platform.

```powershell
bun run dev
bun run lint
bun run typecheck
bun run test
bun run test:e2e
bun run build
```

The app reads curriculum and learning rules from the shared workspace packages.
Browser-specific practice and local persistence belong in client feature
islands; catalog and page content should remain server-rendered where possible.
