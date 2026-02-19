import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // ✅ Static export - API handled by functions/ directory
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
