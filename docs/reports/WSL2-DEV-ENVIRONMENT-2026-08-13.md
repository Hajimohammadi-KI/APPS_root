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

**Practical result:** Tracker, PDF Reader, and Settings are WSL2 dev/testing-only for now (works great — see
above). The Windows-facing installer/launcher integration for these three remains unwired.

## Still true, unchanged by any of this

Everything else about these three apps — the security fixes, CI, the drift-check script, the file:line
findings in the critique docs — is unaffected. This only fixes *running the dev server locally on this
machine*. Nothing here was committed; it's local environment setup, not a repo change.
