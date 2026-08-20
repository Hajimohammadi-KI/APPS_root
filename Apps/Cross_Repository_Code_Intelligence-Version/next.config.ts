import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_STORAGE_MODE:
      process.env.NEXT_PUBLIC_STORAGE_MODE ?? (process.env.VERCEL ? "device" : "server"),
  },
};

export default nextConfig;
