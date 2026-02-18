import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Removed 'output: export' to enable dynamic routes and API routes
  // Cloudflare Pages will use @cloudflare/next-on-pages adapter
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
