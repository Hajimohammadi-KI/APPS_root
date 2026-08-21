// Generic local TCP relay, run inside WSL.
//
// Why this exists: `wrangler dev`/`workerd`'s own listening socket is not
// reachable from Windows on this machine, through any combination of
// Windows Firewall, the separate Hyper-V Firewall layer, netsh portproxy,
// or WSL2 mirrored networking mode -- all confirmed correctly configured,
// all still refused. A plain Node `net` socket on the identical port, under
// the identical setup, IS reachable. So instead of asking Windows to reach
// workerd directly, workerd binds to an internal-only port and this relay
// -- an ordinary socket, the kind that's already proven reachable -- sits
// in front of it on the port Windows actually targets. See
// docs/reports/WSL2-DEV-ENVIRONMENT-2026-08-13.md for the full
// investigation (written for Apps/Starter-App's dev launcher, but the same
// root cause and fix apply here to this app's own standalone installer).
//
// Usage: node tcp-relay.mjs <listenPort> <targetPort>
import net from "node:net";

const [, , listenPortArg, targetPortArg] = process.argv;
const LISTEN_PORT = Number(listenPortArg);
const TARGET_PORT = Number(targetPortArg);

if (!LISTEN_PORT || !TARGET_PORT) {
  console.error("Usage: node tcp-relay.mjs <listenPort> <targetPort>");
  process.exit(1);
}

// A relay that dies silently on an unexpected error is worse than one that
// keeps running -- log and continue rather than let an uncaught exception
// take the whole process down.
process.on("uncaughtException", (err) => {
  console.error("[relay] uncaught:", err && err.stack ? err.stack : err);
});
process.on("unhandledRejection", (err) => {
  console.error("[relay] unhandled rejection:", err);
});

net
  .createServer((client) => {
    const upstream = net.connect(TARGET_PORT, "127.0.0.1");
    upstream.on("error", (e) => {
      console.error("[relay] upstream error:", e.message);
      client.destroy();
    });
    client.on("error", (e) => {
      console.error("[relay] client error:", e.message);
      upstream.destroy();
    });
    client.pipe(upstream);
    upstream.pipe(client);
  })
  .on("error", (e) => console.error("[relay] server error:", e.message))
  .listen(LISTEN_PORT, "0.0.0.0", () => {
    console.log(`[relay] 0.0.0.0:${LISTEN_PORT} -> 127.0.0.1:${TARGET_PORT}`);
  });
