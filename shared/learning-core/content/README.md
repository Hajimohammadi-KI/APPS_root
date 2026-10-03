# Canonical learning-path content

`curriculum-en.json` and `curriculum-de.json` are the preserved source snapshots of the validated 2026.10.02.6 public catalog (124 English and 156 German constructions). All historical task definitions, IDs, mappings, references and review statuses are retained.

The earlier generator depended on a removed German directory and authoring/review documents no longer present in this workspace. The current build starts from these explicit source snapshots instead of reconstructing missing inputs. The original generator is retained in `backups/language-comprehensive-audit-20261002/scripts/build-automaticity-curriculum.ts`.

Run `bun scripts/build-automaticity-assets.ts` to build browser bundles, apply the deterministic variation revision, validate both catalogs and pinned review scopes, publish their local public assets, and synchronize the two active app workspaces. Verify with:

```
bun scripts/build-automaticity-curriculum.ts --check
bun shared/learning-core/sync-workspaces.mjs --check
bun test scripts/variation-revisions.test.ts
```

The variation revision is in `scripts/lib/variation-revisions.ts`. It adds new task identities and explicit retirement links while keeping every old definition byte-equivalent as JSON. New tasks remain authored, open practice; they do not receive human-review status or automatic mastery credit. Existing specific transformation exercises stay active.

The review manifests are pinned to the source content. A build may update the full catalog digest only after verifying that each approved task definition remains unchanged and active. It never generates reviewer approvals. Future authored changes should preserve old definitions and use new versioned identities where the learning task changes.
