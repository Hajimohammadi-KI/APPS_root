import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Vercel builds apps/web directly; desktop builds keep standalone output.
  ...(!process.env.VERCEL ? { output: "standalone" } : {}),
  outputFileTracingRoot: path.resolve(
    import.meta.dirname,
    process.env.VERCEL ? "../../../../.." : "../..",
  ),
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
        { source: "/practice", destination: "/learning-core/practice-de.html" },
        { source: "/heute", destination: "/replacements/de/heute.html" },
        {
          source: "/grammatik",
          destination: "/replacements/de/grammatik.html",
        },
      ],
      afterFiles: process.env.VERCEL
        ? []
        : [
            {
              source: "/api/v1/:path*",
              destination: "http://127.0.0.1:4210/api/v1/:path*",
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
