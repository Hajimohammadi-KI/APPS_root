# Current English Home Dashboard integration

This folder contains the current Home dashboard used by the active English Automaticity application.

## Files

- `dashboard-v2-screen.tsx`: responsive React dashboard connected to the learner store and grammar content.
- `dashboard-v2.css`: page-scoped visual design.

## Required application dependencies

The screen expects these existing aliases from the English application:

- `@grammar/content`
- `@/features/store/app-store`
- `lucide-react`

Mount it from the application shell with:

```tsx
<DashboardV2Screen navigate={navigate} />
```

Import `dashboard-v2.css` once from the application's global stylesheet. The active English application already uses this exact integration.
