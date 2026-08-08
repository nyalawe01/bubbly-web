import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint runs during builds by default; this block exists so the flag can be
    // flipped quickly if a future tooling regression breaks the build again.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
