import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloudflare Pages에서 API 라우트를 사용하기 위해 export 모드 비활성화
  // output: 'export',
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
