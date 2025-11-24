import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Note: Turbopack HMR warnings for JSON imports are a known issue
  // and are harmless. They don't affect functionality.
  // This is expected behavior and will be fixed in future Turbopack versions.
};

export default nextConfig;
