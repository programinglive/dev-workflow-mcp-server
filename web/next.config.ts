import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Netlify deployment
  output: 'export',
  // Set turbopack root to silence multi-lockfile warning
  turbopack: {
    root: __dirname,
  },
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
