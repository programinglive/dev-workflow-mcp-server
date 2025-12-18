import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Netlify deployment
  // Static export removed for server-side features
  // output: 'export',
  // Set turbopack root to silence multi-lockfile warning
  turbopack: {
    root: __dirname,
  },
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Exclude native modules from bundling
  serverExternalPackages: ['pg'],
};

export default nextConfig;
