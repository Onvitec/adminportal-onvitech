import type { NextConfig } from "next";
interface CustomNextConfig extends NextConfig {
  eslint?: {
    ignoreDuringBuilds: boolean;
  };
}
const nextConfig: CustomNextConfig = {
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
}

export default nextConfig;
