import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The Vercel project root is two levels above this nested web app, so its framework adapter must find .next there.
  // Local and Windows builds keep standalone output inside the web workspace through the same configured path.
  ...(process.env.VERCEL
    ? { distDir: "../../.next" }
    : { output: "standalone" }),
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
  experimental: {
    useTypeScriptCli: true,
  },
  transpilePackages: [
    "@grammar/content",
    "@grammar/contracts",
    "@grammar/domain",
  ],
  typedRoutes: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/heute", destination: "/replacements/de/heute.html" },
        {
          source: "/grammatik",
          destination: "/replacements/de/grammatik.html",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
