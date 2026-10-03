import path from "node:path";

// Vercel builds apps/web directly; desktop builds keep standalone output.
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
