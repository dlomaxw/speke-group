import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * libsql ships native bindings (local development only) and must be
   * required by Node at runtime rather than bundled.
   */
  serverExternalPackages: ['@libsql/client', 'libsql', 'bcryptjs'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};

export default nextConfig;
