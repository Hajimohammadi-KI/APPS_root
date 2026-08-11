# DeutschFlow API

NestJS API running on Bun.

```powershell
bun run dev
bun run lint
bun run typecheck
bun run test
bun run test:integration
bun run build
bun run start
```

Current endpoints:

- `GET /api/v1/health`
- `GET /api/v1/bootstrap`

The default development port is `4000`. Set `API_PORT` and `WEB_ORIGINS` through
the environment when needed.
