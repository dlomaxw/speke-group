import 'server-only';
import { lt, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { rateLimits } from '@/db/schema';

/**
 * Fixed-window rate limit stored in the database, so every server instance
 * shares one count (an in-memory map would reset per instance on Vercel).
 * The read and the increment are a single statement, so two requests at the
 * same moment cannot both slip under the limit.
 */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const db = await getDb();
  const now = Date.now();
  const windowStart = now - (now % windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${rateLimits.windowStart} < ${windowStart} then 1 else ${rateLimits.count} + 1 end`,
        windowStart: sql`case when ${rateLimits.windowStart} < ${windowStart} then ${windowStart} else ${rateLimits.windowStart} end`,
      },
    })
    .returning({ count: rateLimits.count });

  // Occasionally clear counters from windows long gone.
  if (Math.random() < 0.02) {
    await db.delete(rateLimits).where(lt(rateLimits.windowStart, now - 24 * 60 * 60 * 1000));
  }

  const count = Number(row?.count ?? 1);
  return {
    ok: count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)),
  };
}

/** The caller's address as reported by Vercel's edge. */
export function clientIp(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
