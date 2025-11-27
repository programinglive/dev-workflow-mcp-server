import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  experimental: {
    turbopack: {
      root: path.resolve(process.cwd(), '..'),
    }
  } as any
};

export default nextConfig;
