import path from "node:path";

// Vercel builds apps/web directly; desktop builds keep standalone output.
// Locally the tracing root is this project's own folder (two levels above
// apps/web); nothing outside the project folder is imported, so a copy of the
// folder builds the same way on its own as inside a larger checkout. On Vercel
// the project is always placed at /vercel/path0, and the Vercel Next builder
// expects the trace root at the container root (five levels up resolves to /);
// a narrower root breaks its page-data and output tracing steps.
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  ...(!process.env.VERCEL ? { output: "standalone" } : {}),
  outputFileTracingRoot: path.resolve(process.cwd(), process.env.VERCEL ? "../../../../.." : "../.."),
  reactStrictMode: true,
  transpilePackages: ["@grammar/content"],
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/practice", destination: "/learning-core/practice-en.html" },
        { source: "/daily", destination: "/replacements/en/daily.html" },
        { source: "/grammar", destination: "/replacements/en/grammar.html" },
      ],
      afterFiles: process.env.VERCEL ? [] : [
        { source: "/api/health", destination: "http://127.0.0.1:4201/api/health" },
        { source: "/api/assessment", destination: "http://127.0.0.1:4201/api/assessment" },
      ],
    };
  },
  async headers() {
    return [{ source: "/sw.js", headers: [
      { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      { key: "Service-Worker-Allowed", value: "/" },
    ] }];
  },
};

export default nextConfig;
