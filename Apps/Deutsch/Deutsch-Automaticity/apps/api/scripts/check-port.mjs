/**
 * Pre-flight port check for the DeutschFlow API.
 *
 * A stale dev/start process left running from a previous session is a known
 * source of confusing crashes: Nest boots successfully, then fails to bind
 * with a raw `EADDRINUSE` stack trace that doesn't say what to do about it.
 *
 * This runs before `dev` and `start` (see package.json) and fails fast with
 * a clear, actionable message instead of letting that happen.
 */
// Node's built-in TCP module — used to probe the port without needing any
// extra dependency.
import net from 'node:net';

// Same env var and default the real API server (src/main.ts) binds to, so
// this check is always looking at the exact port that's about to be used.
const port = Number(process.env.API_PORT ?? 4210);
// Bind on all interfaces, matching how the API server itself binds.
const host = '0.0.0.0';

// Tries to open a throwaway TCP listener on the given port/host.
// Resolves to `true` if the port was free (and immediately closes the
// listener again so it doesn't hold the port), or `false` if something
// else is already bound there.
function isPortFree(candidatePort, candidateHost) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    // Don't let this throwaway server keep the Node process alive.
    tester.unref();
    tester.once('error', (error) => {
      // EADDRINUSE means the port is taken; any other error we don't
      // recognize here, so don't claim the port is free on a fluke.
      resolve(error.code !== 'EADDRINUSE');
    });
    tester.once('listening', () => {
      // We only wanted to know if the port was free — close right away.
      tester.close(() => resolve(true));
    });
    tester.listen(candidatePort, candidateHost);
  });
}

// Run the check once, up front, before anything else in `dev`/`start` runs.
const free = await isPortFree(port, host);

if (!free) {
  // Give a copy-pasteable command for whichever OS this is running on,
  // instead of leaving the developer to look up "how do I find what's using
  // a port" themselves.
  const stopHint =
    process.platform === 'win32'
      ? `PowerShell: Get-NetTCPConnection -LocalPort ${port} | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }`
      : `Shell: lsof -ti tcp:${port} | xargs kill`;

  // Print a clear, multi-line message (blank lines around it so it stands
  // out from normal terminal noise) instead of letting the raw Nest
  // EADDRINUSE stack trace be the only clue.
  console.error(
    [
      '',
      `[api] Port ${port} is already in use — another DeutschFlow API process is likely still running.`,
      '[api] Stop it before starting a new dev/start session, then re-run this command.',
      `[api]   ${stopHint}`,
      '',
    ].join('\n'),
  );
  // Exit before Nest ever tries to bind, so the failure is this clear
  // message and nothing else.
  process.exit(1);
}
