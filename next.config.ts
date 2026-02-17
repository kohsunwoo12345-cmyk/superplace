import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // 개발 서버 테스트를 위해 임시 비활성화
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
