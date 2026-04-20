import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  experimental: { serverActions: { bodySizeLimit: "10mb" } }
};
export default config;
