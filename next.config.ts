import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // 개발 환경에서는 비활성화, 프로덕션에서만 활성화
  ...(isProduction && { output: 'export' }),
  ...(isProduction && { trailingSlash: true }),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 클라이언트 사이드에서 Node.js 모듈 무시
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        'node:https': false,
        'node:http': false,
        'node:fs': false,
        'node:stream': false,
        'node:zlib': false,
      };
    }
    return config;
  },
};

export default nextConfig;
