import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * These ship wasm or native bindings and must be required by Node at
   * runtime rather than bundled — PGlite in particular fails to resolve its
   * filesystem when the bundler rewrites its module paths.
   */
  serverExternalPackages: ['@electric-sql/pglite', 'postgres', 'bcryptjs'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },
};

export default nextConfig;
