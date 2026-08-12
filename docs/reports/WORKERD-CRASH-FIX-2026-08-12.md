# Fixing the Tracker/PDF Reader/Settings crash — ready-to-run steps

## What's blocked

`Tracker`, `Reader-PDF-App`, and `Einstellungen-APP` (the three Cloudflare Workers apps) cannot start locally. Every `wrangler dev` / `vite dev` attempt crashes identically:

```
*** std::terminate() called with no exception
Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94
```

## What was already ruled out (no admin rights needed, all tried and failed)

- Upgraded wrangler `4.92.0 → 4.122.0` (latest available) — same crash.
- Fixed a real, separate config bug (`legacy_env` field) along the way — permanent, kept.
- Tried explicit and disabled inspector ports — same crash.
- Killed stale `workerd.exe`/dev-server processes, cleared `.wrangler/state` — same crash.
- Ran under a clean, standalone Node 22.23.2 install (`tools/node22/`, not the system Node 24) — same crash. (This also proved the crash is inside `workerd.exe` itself, a native binary spawned as a child process — it never runs under whichever Node launched `wrangler` in the first place, so no Node version swap can fix it.)
- Full clean `node_modules` reinstall to rule out a dependency version mismatch — same crash.
- Tried Tracker's alternate `vite`-based dev command instead of raw `wrangler dev` — same crash, confirming it's not specific to one entry point.
- Checked VC++ Redistributable (`v14.44.35211`, current) and Windows build (11 25H2, build 26200, current) — neither is outdated.

## What's left — both need Administrator rights, which this session doesn't have

### Option A — try first: Windows Defender exclusion (fast, easily reversible)

Open **PowerShell as Administrator** (right-click PowerShell → "Run as administrator"), then paste:

```powershell
Add-MpPreference -ExclusionPath "D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version"
Add-MpPreference -ExclusionPath "D:\APPS_root\Apps\Apps-For-Integeration\Reader-PDF-App"
Add-MpPreference -ExclusionPath "D:\APPS_root\Apps\Apps-For-Integeration\Einstellungen-APP"
Add-MpPreference -ExclusionProcess "workerd.exe"
```

Then, in a normal (non-admin) terminal:

```powershell
cd D:\APPS_root\Apps\Cross_Repository_Code_Intelligence-Version
bun run build
bun run start
```

If the Tracker starts cleanly (no `std::terminate`), the crash was real-time-scanning interference — the same exclusions already apply to the other two apps.

**To undo later:** `Remove-MpPreference -ExclusionPath "..."` / `Remove-MpPreference -ExclusionProcess "workerd.exe"` for each path above.

### Option B — if A doesn't work: run these three apps under WSL2

The crash is Windows-native-libuv-specific; Cloudflare's Linux `workerd` build is a different binary and very likely unaffected. As Administrator:

```powershell
wsl --install
```

(Reboot if prompted.) Then from inside the WSL2 Ubuntu shell, clone or access the repo via `/mnt/d/APPS_root/...`, install Bun there, and run the three apps' dev servers from Linux instead of Windows PowerShell. This is a bigger step — only worth it if Option A doesn't resolve things.

## Ask me to re-test

Once either option is done, just say so — I'll re-run `bun run start` in all three apps and confirm the crash is gone before we move on to actually testing them.
