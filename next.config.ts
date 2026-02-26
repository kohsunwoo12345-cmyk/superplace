import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Cloudflare Pages를 위한 static export
  output: 'export',
  distDir: 'out',
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
