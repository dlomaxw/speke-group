import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

/** Production is indexable apart from staff areas; every other environment is not. */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== 'production') {
    return { rules: [{ userAgent: '*', disallow: '/' }] };
  }
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }] };
}
