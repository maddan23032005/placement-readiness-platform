import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev tools from localhost/127.0.0.1 (Turbopack HMR)
  allowedDevOrigins: ["localhost", "127.0.0.1"],
};

export default nextConfig;
