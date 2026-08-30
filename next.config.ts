import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the workspace root here so a stray parent-level lockfile is ignored.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
