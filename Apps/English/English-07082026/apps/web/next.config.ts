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
	async rewrites() {
		return {
			beforeFiles: [
				{ source: "/daily", destination: "/replacements/en/daily.html" },
				{ source: "/grammar", destination: "/replacements/en/grammar.html" },
			],
		};
	},
};

export default nextConfig;
