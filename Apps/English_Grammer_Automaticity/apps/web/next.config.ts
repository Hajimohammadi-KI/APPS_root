import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd(), "../.."),
  experimental: {
    useTypeScriptCli: true,
  },
  reactStrictMode: true,
  transpilePackages: ["@grammar/content"],
};

export default nextConfig;
