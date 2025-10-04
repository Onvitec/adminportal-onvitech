import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // This allows all hostnames (Next.js 13.4+)
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
    unoptimized: false, // keep optimization on
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
