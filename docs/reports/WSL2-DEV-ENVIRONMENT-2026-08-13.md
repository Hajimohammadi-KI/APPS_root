# WSL2 dev environment for Tracker, PDF Reader, and Settings — 2026-08-13

## Why this exists

`wrangler dev` crashes immediately on this Windows machine with a native `std::terminate()` inside
`workerd.exe` (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 94`) —
confirmed reproducible across wrangler versions, Node versions, clean reinstalls, and a Windows Defender
exclusion. It does **not** happen under WSL2/Linux, using the exact same source code. Verified 2026-08-13:
all three apps build and serve real `200` responses under WSL2.

## What's installed

- WSL2 core + Ubuntu 26.04 (`wsl -d Ubuntu`), running everything as `root` — no interactive Unix user was
  created, since that setup wizard can't run non-interactively. If you want a normal user later, run
  `wsl -d Ubuntu` once from a real terminal and follow the prompt; not required for dev use.
- Bun 1.3.14 at `~/.bun/bin/bun` inside the WSL Ubuntu install.
- Node.js 22.22.1 via `apt install nodejs` — **required even though Bun is installed**, because `wrangler`'s
  CLI entrypoint has a `#!/usr/bin/env node` shebang; Bun alone does not satisfy it.

## The one real gotcha: local npm caches don't survive being copied

Each of these three apps has an `.npmrc` pointing `cache` at a repo-local directory (`.npm-cache` for
Tracker, `.sites-runtime/npm-cache` for PDF Reader and Settings — **the name differs per app**, check each
app's own `.npmrc` before assuming). If that cache directory gets copied from the Windows install (e.g. via
`rsync` without excluding it), the copy ends up missing `vinext`'s `dist/` folder — the published package
apparently needs a script step that only completes correctly on a genuinely fresh install — which then fails
as `vinext: command not found` at build time even though `node_modules/vinext/package.json` exists. Fix:
delete both `node_modules` and the app's local cache dir, then `bun install` again from scratch. Always
exclude both when copying an app: `rsync -a --exclude node_modules --exclude .npm-cache --exclude
.sites-runtime ...`.

## Where the working copies live

To avoid fighting over `node_modules` (Windows and Linux need different native binaries for the same
packages — `@cloudflare/workerd-windows-64` vs `@cloudflare/workerd-linux-64` — so installing from one OS
overwrites what the other needs), source was copied once into WSL's own native filesystem rather than run
directly against `/mnt/d`:

```
~/test/tracker      (from Apps/Cross_Repository_Code_Intelligence-Version)
~/test/pdf-reader    (from Apps/Apps-For-Integeration/Reader-PDF-App)
~/test/settings      (from Apps/Apps-For-Integeration/Einstellungen-APP)
```

These are **snapshots**, not a live link — code edits made on the Windows side (`D:\APPS_root\...`, via git,
your editor, or me) do not automatically appear there. Before testing a change, resync:

```bash
wsl -d Ubuntu -u root -- bash -c '
rsync -a --exclude node_modules --exclude .next --exclude dist --exclude .wrangler \
  --exclude .npm-cache --exclude .sites-runtime \
  /mnt/d/APPS_root/Apps/Cross_Repository_Code_Intelligence-Version/ ~/test/tracker/
'
```

(swap the source/dest for the other two apps as needed). `node_modules` only needs reinstalling if
`package.json`/the lockfile actually changed — otherwise the existing Linux-native install still works.

## Running one of the three apps

From Windows (PowerShell or this Bash tool), avoid Git Bash's automatic `/mnt/...` path mangling by setting
`MSYS_NO_PATHCONV=1`, and call into WSL:

```bash
MSYS_NO_PATHCONV=1 wsl -d Ubuntu -u root -- bash -c '
export PATH="$HOME/.bun/bin:$PATH"
cd ~/test/tracker
bun run build && bun run start
'
```

Each app binds to `127.0.0.1` on its usual port (Tracker `4312`, PDF Reader `4322`, Settings `4323`) —
WSL2's default networking mirrors `localhost` to the Windows host, so `http://127.0.0.1:4312` etc. should
also work directly from a Windows browser without extra configuration.

## Known limitation: Windows cannot reach the WSL-hosted server (installer integration blocked)

Confirmed 2026-08-13, after extensive testing: **`wrangler`/`workerd` running inside WSL2 is not reachable
from Windows**, even though the app works perfectly *inside* WSL. This blocks wiring these three apps into
`Apps/Starter-App/server.mjs` or `SETUP-WINDOWS.bat` for a real double-click launcher — those run on Windows
and need to open a browser pointing at the service.

**What was ruled out, with hard evidence, not guesses:**
- Standard Windows Firewall rule (inbound, TCP, correct ports, `Enabled: True`) — added, connection still refused.
- The separate Hyper-V Firewall layer (`Get-NetFirewallHyperVRule`, distinct from the standard one — WSL2 runs as
  a lightweight Hyper-V VM) — same rule confirmed present there too (`EnforcementStatus: OK`), still refused.
- `netsh interface portproxy` (both under NAT-mode networking and combined with the firewall rules above) — times out.
- WSL2 "mirrored" networking mode (`networkingMode=mirrored` in `.wslconfig`) — requires a full reboot to
  activate (`wsl --shutdown` alone isn't enough); after a real reboot it **does** work for a plain Python
  `http.server` on the same port (proven — Windows could reach it), but **not** for `wrangler`/`workerd`
  specifically, on that identical port, in that identical setup.
- IPv6/IPv4 dual-stack binding, network namespace isolation, Windows' reserved/excluded port ranges — all
  checked and ruled out as the cause.

**Conclusion:** the block is specific to how `workerd`'s own C++ networking layer (`kj/async-io-unix.c++`,
Cloudflare's own async I/O library) creates its listening socket — something about it isn't visible/reachable
through Hyper-V's virtualized network stack the way a normal process's socket is. This is not fixable through
Windows/WSL configuration; it would need a fix in `workerd` itself or a fundamentally different bridging
approach (e.g. `wrangler dev --tunnel`, which was evaluated and deliberately not used — see below).

**Deliberately not used: `wrangler dev --tunnel`.** This flag creates a public Cloudflare Quick Tunnel,
which would trivially solve the connectivity problem (WSL makes an outbound connection to Cloudflare; no
inbound Windows/Hyper-V networking involved at all). Not used because these three apps store live secrets
(Google OAuth client credentials, encrypted provider API keys) — putting them on a public, internet-reachable
URL, even an obscure random one, for routine local dev use is a real security posture change that wasn't
worth the tradeoff. If this is ever revisited, that's the fastest fix, but treat it as a deliberate,
consent-required decision, not a default.

**RESOLVED, 2026-08-13 (later the same day).** Found the fix: instead of asking Windows to reach `workerd`
directly, run a tiny local TCP relay (`Apps/Starter-App/wsl/tcp-relay.mjs`) inside WSL in front of it. The
relay is an ordinary Node socket — the same kind already proven reachable — so it bridges cleanly where
`workerd`'s own socket wouldn't. Combined with `netsh portproxy` (Windows `127.0.0.1:<port>` →
current WSL VM IP) and a firewall rule, this is now fully wired into `Apps/Starter-App/server.mjs` and
verified stable through the real launcher API for all three apps, holding steady for 30+ seconds under load
— not just an instant response.

Two real bugs surfaced and got fixed along the way, both worth knowing about if this breaks again:
1. **False "already running" status.** `netsh portproxy`'s own Windows-side listener accepts a TCP
   handshake immediately regardless of whether anything is listening on the WSL side. A plain TCP-connect
   health check (the original `isPortOpen`) is fooled by this — it happily reports "running" for a
   completely dead backend. Fixed by replacing it with a real HTTP request (`isHttpUp` in `server.mjs`) that
   has to round-trip through the relay to succeed.
2. **Tracker's API was never built** in the WSL-side copy (`~/apps/tracker/apps/api/dist/main.js` didn't
   exist) — a setup gap, not a code bug. `bun run build` inside that directory fixes it; needed once per
   fresh WSL-side copy.

**Architecture, for future reference:**
- `Apps/Starter-App/wsl/tcp-relay.mjs` — the generic relay (listen port, target port as argv).
- `Apps/Starter-App/wsl/launch-via-relay.sh` — starts a backend on an internal-only port, waits for it to
  actually respond, then starts the relay on the public port. Used by three thin per-app wrappers
  (`launch-tracker.sh`, `launch-tracker-api.sh`, `launch-pdf-reader.sh`, `launch-settings.sh`) so
  `server.mjs` never has to build a fragile multi-layer-quoted command string.
- `Apps/Starter-App/wsl/ensure-portproxy.ps1` — self-elevating (one UAC prompt), idempotent, refreshes the
  portproxy target IP every run since the WSL VM's DHCP-assigned IP can change across restarts. Called once
  per `Starter-App/server.mjs` session, only when a WSL-hosted app is actually requested (not unconditionally
  at startup, so English/German-only users never see a UAC prompt).
- Internal ports are the public port + 11000 (e.g. Tracker web `4312` → internal `15312`) — arbitrary but
  consistent, chosen to avoid colliding with anything else in the 1000-9999 range already in use.

**Practical result:** Tracker, PDF Reader, and Settings now start and stay running through
`Apps/Starter-App`'s real `/api/start/<id>` and `/api/start-all` endpoints — the same ones the Starter-App UI
calls — exactly like English and German. `START-APPS.cmd` → Starter-App → any of the 5 apps now works
uniformly from a user's perspective; the WSL relay indirection is invisible to them.

## Still true, unchanged by any of this

Everything else about these three apps — the security fixes, CI, the drift-check script, the file:line
findings in the critique docs — is unaffected. This only fixes *running the dev server locally on this
machine*. Nothing here was committed; it's local environment setup, not a repo change.

## Update 2026-08-13 (later still): Tracker's own standalone Windows installer had the same bug

Everything above fixes the **dev workflow** (`Apps/Starter-App`'s launcher). But Tracker
(`Apps/Cross_Repository_Code_Intelligence-Version`) also ships its own independent, self-contained Windows
installer (`SETUP-WINDOWS.bat` → `scripts/setup-windows.ps1` → `scripts/start-local-app.ps1`), which a real
user runs directly — this is a completely separate code path from Starter-App and was not fixed by anything
above. Confirmed by direct reproduction: running this installer's own exact `"start"` script
(`wrangler dev dist/server/index.js --config dist/server/wrangler.json ...`) natively crashes with the
identical `std::terminate()` inside `workerd.exe`. A user would get past install (npm ci + build don't touch
workerd) and only hit the crash at the very last step — the app failing to start after a "successful"
install.

Note: Tracker's API (`apps/api`, plain Bun/NestJS, `bun dist/main.js`) has no workerd dependency and always
ran fine natively — only the web half needed this fix.

**Fix applied directly inside Tracker's own repo, self-contained (does not depend on `Apps/Starter-App` being
present — this installer is meant to be redistributable on its own):**

- `scripts/wsl/tcp-relay.mjs` — same generic relay as Starter-App's, copied in.
- `scripts/wsl/prepare-wsl.sh` — rsyncs the installed app into `~/apps/cross-repository-code-intelligence-installed`
  (WSL-native filesystem, for the same node_modules-native-binary reason as above) and runs `bun install`
  there once, so `wrangler`/`workerd` resolve to Linux-native binaries. Only needs the build *output*
  (`dist/server`, `apps/api/dist`) synced over — the actual build still happens on Windows as before.
- `scripts/wsl/run-web.sh` — starts `wrangler dev` on an internal-only port (`15412`) inside that WSL copy,
  waits for it to respond, then starts the relay on the public port (`4312`). Self-healing: kills anything
  already on either port before starting, so a previous failed/killed attempt never blocks a retry.
- `scripts/wsl/ensure-portproxy.ps1` — same idea as Starter-App's, scoped to just port 4312 (Tracker's API
  doesn't need it — see above). Improved here to check *first*, as a normal user, whether the existing
  portproxy rule already points at the current WSL IP, and only elevates (one UAC prompt) when something
  actually needs to change — avoids a UAC prompt on every single ordinary app launch once set up once.
- `scripts/setup-windows.ps1` — `Install-Dependencies` now calls a new `Initialize-WslCopy` step right after
  the Windows build succeeds, so `prepare-wsl.sh` runs once at install/update/repair time rather than lazily
  during the first start (keeps `Wait-ForAppReady`'s 180s timeout comfortable).
- `scripts/start-local-app.ps1` — the web process launch changed from
  `Start-Process $BunExecutable -ArgumentList @("run","start")` to
  `Start-Process wsl.exe -ArgumentList @("-d","Ubuntu","-u","root","--","bash",$RunWebScriptWsl)`. The API
  launch is untouched (still native). `Stop-StaleRuntimeProcesses` now also matches a stray `wsl.exe`
  running `run-web.sh` by command-line substring, since Windows path-based matching doesn't apply to it.

**A real bug surfaced by testing the actual files, not a synthetic replication:** backslashes were silently
eaten somewhere in the PowerShell → `wsl.exe` → `wslpath` argument-passing chain — `"D:\APPS_root\..."`
arrived at `wslpath` as `"D:APPS_root..."` (no separators at all), breaking every path conversion. Fixed by
converting to forward slashes (`$WindowsPath.Replace('\','/')`) before calling `wslpath -a` — Windows path
APIs accept forward slashes fine, and it sidesteps the escaping ambiguity entirely. Both call sites
(`ConvertTo-WslPath` in `start-local-app.ps1`, and the inline calls in `setup-windows.ps1`'s
`Initialize-WslCopy`) needed this fix.

**Verified working end-to-end using the real, final files** (not a manual stand-in): ran the actual
`scripts/start-local-app.ps1` as the installer will invoke it. Output: `Web und API sind bereit.` 4 seconds
after starting, on the first attempt. Both `http://127.0.0.1:4312/api/state` and
`http://127.0.0.1:4313/v1/health` held `200` for 30+ seconds under polling, then both processes (WSL-side
wrangler/relay and native API) shut down cleanly with no leftover processes on either side.

**One environment gotcha hit during this testing, not a code bug:** Starter-App's dev-flow portproxy had a
stale rule forwarding port 4313 (Tracker's API port) to its own WSL-side relay, left over from earlier
verification runs. Since a portproxy rule genuinely occupies the port on the Windows side, this collided
with Tracker's native API trying to bind directly to the same port (`EADDRINUSE`). Not a bug in either
installer — it's an expected consequence of Starter-App's dev flow and Tracker's own standalone installer
both defaulting to the same public ports, and only one of the two should be running at a time. Cleared with
`netsh interface portproxy delete v4tov4 listenport=4313 listenaddress=127.0.0.1` (elevated); Starter-App's
own `ensure-portproxy.ps1` will simply re-add it next time Starter-App is used to run Tracker, since it
unconditionally re-applies all its ports every run.
