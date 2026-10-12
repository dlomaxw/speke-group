import type { NextConfig } from 'next';

/** Anything other than the live production deployment stays out of search engines. */
const isProduction = process.env.VERCEL_ENV === 'production';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProduction ? [] : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
];

const nextConfig: NextConfig = {
  /**
   * libsql ships native bindings (local development only) and must be
   * required by Node at runtime rather than bundled.
   */
  serverExternalPackages: ['@libsql/client', 'libsql', 'bcryptjs'],

  poweredByHeader: false,

  experimental: {
    serverActions: {
      /**
       * Photo uploads from the dashboard travel as a server action, and the
       * default ceiling is 1MB — which almost every photograph off a camera
       * or a phone exceeds, failing the POST before our code sees it. The
       * browser shrinks images before sending (see MediaField), so this is
       * headroom rather than the usual case. It stops below Vercel's own
       * 4.5MB limit on a request body, because above that the request would
       * fail at the platform instead, where we cannot explain it.
       */
      bodySizeLimit: '4mb',
    },
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
    ],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Staff screens and APIs are never stored by shared caches.
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }, { key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/api/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ];
  },
};

export default nextConfig;
