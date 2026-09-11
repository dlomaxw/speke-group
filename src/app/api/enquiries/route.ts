import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { enquiries } from '@/db/schema';

export const runtime = 'nodejs';

const KINDS = ['general', 'stay', 'event', 'dining', 'careers', 'press'] as const;
type Kind = (typeof KINDS)[number];

/** Crude in-memory throttle: enough to stop a bot hammering the form. */
const recent = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();   // keep the map from growing forever
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many messages from this connection. Please try again later.' },
      { status: 429 },
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Could not read that request.' }, { status: 400 });
  }

  // A hidden field real people never fill in.
  if (typeof payload.website === 'string' && payload.website.trim() !== '') {
    return NextResponse.json({ ok: true });   // silently accept, store nothing
  }

  const str = (v: unknown, max: number) =>
    typeof v === 'string' ? v.trim().slice(0, max) : '';

  const name = str(payload.name, 160);
  const email = str(payload.email, 255);
  const message = str(payload.message, 5000);
  const phone = str(payload.phone, 60) || null;
  const subject = str(payload.subject, 250) || null;
  const kindRaw = str(payload.kind, 20);
  const kind: Kind = (KINDS as readonly string[]).includes(kindRaw) ? (kindRaw as Kind) : 'general';

  if (!name) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
  }
  if (message.length < 10) {
    return NextResponse.json({ error: 'Please write a little more so we can help.' }, { status: 400 });
  }

  try {
    const db = await getDb();
    await db.insert(enquiries).values({
      name, email, phone, subject, message, kind,
      sourcePage: str(payload.sourcePage, 160) || '/contact',
      userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    });
  } catch (e) {
    console.error('enquiry insert failed:', e);
    return NextResponse.json(
      { error: 'We could not save your message. Please call us instead.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
