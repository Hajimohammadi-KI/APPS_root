import net from "node:net";

const [, , listenPortArg, targetPortArg] = process.argv;
const listenPort = Number(listenPortArg);
const targetPort = Number(targetPortArg);
if (!listenPort || !targetPort) {
  console.error("Usage: node tcp-relay.mjs <listenPort> <targetPort>");
  process.exit(1);
}

process.on("uncaughtException", (error) => console.error("[relay] uncaught:", error));
process.on("unhandledRejection", (error) => console.error("[relay] unhandled rejection:", error));

net.createServer((client) => {
  const upstream = net.connect(targetPort, "127.0.0.1");
  upstream.on("error", (error) => { console.error("[relay] upstream error:", error.message); client.destroy(); });
  client.on("error", (error) => { console.error("[relay] client error:", error.message); upstream.destroy(); });
  client.pipe(upstream);
  upstream.pipe(client);
}).on("error", (error) => console.error("[relay] server error:", error.message))
  .listen(listenPort, "0.0.0.0", () => {
    console.log(`[relay] 0.0.0.0:${listenPort} -> 127.0.0.1:${targetPort}`);
  });
