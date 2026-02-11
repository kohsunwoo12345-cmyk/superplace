import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ❌ output: 'export'는 정적 빌드만 지원 - 동적 라우팅 불가
  // ✅ 제거하여 서버 사이드 기능 활성화
  trailingSlash: false, // Cloudflare Pages에서는 false 권장
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Cloudflare Pages 최적화
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
