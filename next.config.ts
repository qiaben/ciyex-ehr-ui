import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // skip type errors during production build
    // REMOVE this once the codebase is free of blocking TS errors.
    ignoreBuildErrors: true,
  },
  // Next.js 16 uses Turbopack by default - add empty config to silence warning
  turbopack: {},
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
