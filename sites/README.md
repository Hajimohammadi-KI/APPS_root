# Automaticity roadmap Vercel projects

These two dependency-free static site packages copy the authoritative roadmap HTML files into exact, verified Vercel artifacts. The generated `dist/` directories are intentionally ignored.

| Vercel project | Root Directory | Authoritative source |
|---|---|---|
| `automaticity-evidence-roadmap` | `sites/automaticity-evidence-roadmap` | `docs/roadmaps/automaticity-evidence-roadmap.html` |
| `automaticity-ux-roadmap` | `sites/automaticity-ux-roadmap` | `docs/reports/ux-simplification-roadmap-visual.html` |

For both projects:

- Git repository: `Hajimohammadi-KI/APPS_root`
- Production branch: `main`
- Framework preset: `Other`
- Build command: `npm run build` (from `vercel.json`)
- Output directory: `dist` (from `vercel.json`)
- Install command: leave at the Vercel default; there are no package dependencies

The build fails closed if the document is not a complete Persian RTL HTML page, lacks its site-specific marker, lacks a version marker, or differs byte-for-byte after copying.
