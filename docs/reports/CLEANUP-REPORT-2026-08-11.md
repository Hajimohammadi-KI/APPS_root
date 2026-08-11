# Safe cleanup report — 2026-08-11

## Scope and safety rule

The workspace was searched for file and directory names containing `err`, `error`, `delet`, `backup`, `recovery`, or `recovered`. No source file was permanently deleted. A file was moved only when it was a generated runtime error log and was not imported, referenced by a package script, or required by a running application.

## Files moved to the recoverable deleted folder

| Original path | New path | Reason |
| --- | --- | --- |
| `D:\APPS_root\Apps\English\English-07082026\runtime-cefr-english.log.err` | `D:\APPS_root\deleted\Apps\English\English-07082026\runtime-cefr-english.log.err` | Generated runtime error log; not source and not imported |
| `D:\APPS_root\German-web.log.err` | `D:\APPS_root\deleted\German-web.log.err` | Generated runtime error log; not source and not imported |
| `D:\APPS_root\German-runtime-web.err.log` | `D:\APPS_root\deleted\German-runtime-web.err.log` | Generated runtime error log; not source and not imported |

## Files deliberately retained

The following names contain `error`, `err`, or `delete`, but they are active code, tests, styles, or evidence and must not be removed:

- `lib/google-errors.ts` and Google error tests in Settings and Tracker.
- English `features/screens/errors-screen.tsx` and German `features/errors/error-engine.tsx`.
- `99-modern-overrides.css` and `99-visual-refresh-overrides.css`; these are imported active styles, not disposable overrides.
- Recovery and recovered-legacy inventory documents; these record the migration boundary.
- English `apps/web/lib/backup-directory.ts`; this is imported backup functionality.
- Package/library files whose normal technical name contains `delete`.

## Backup destination

No confirmed obsolete backup or recovery copy was found that could be moved safely to `D:\Backup`. Therefore nothing was moved there. Active backup code and recovery evidence were left in place.

## Result

- No application source was permanently deleted.
- All three primary applications still build and run after cleanup.
- Side applications for PDF and Settings also build, test, and run.

