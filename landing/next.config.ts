import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    turbopackPluginRuntimeStrategy: 'workerThreads',
  },
};

export default nextConfig;
