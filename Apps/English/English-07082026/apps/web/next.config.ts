import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  experimental: {
    useTypeScriptCli: true,
  },
  reactStrictMode: true,
  transpilePackages: ["@grammar/content"],
};

export default nextConfig;
