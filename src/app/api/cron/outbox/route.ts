import { NextResponse } from 'next/server';
import { processOutbox } from '@/lib/outbox';

export const dynamic = 'force-dynamic';

/**
 * Scheduled sweep of the staff-alert queue, for retries that fall due while
 * nobody is submitting enquiries or looking at the inbox. Vercel Cron calls it
 * with the CRON_SECRET bearer token.
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Not allowed' }, { status: 401 });
  }
  const result = await processOutbox(50);
  return NextResponse.json(result);
}
