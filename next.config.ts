import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // Cloudflare Pages 정적 빌드
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
