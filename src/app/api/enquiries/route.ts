import { createHash } from 'node:crypto';
import { NextResponse, after } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { enquiries, properties } from '@/db/schema';
import { validateEnquiry, enquiryReference } from '@/lib/enquiry-rules';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { processOutbox } from '@/lib/outbox';

export const runtime = 'nodejs';

/**
 * POST /api/enquiries
 *
 * Requires an Idempotency-Key header (or an idempotencyKey field for plain
 * form posts). Responses:
 *   201  saved; body carries the reference. The same key sent again returns
 *        the original receipt with Idempotent-Replayed: true.
 *   422  invalid fields, a missing key, or a key reused for different details
 *   429  too many submissions from this connection
 *   503  the enquiry could not be stored; nothing was accepted
 *
 * Success is only reported after the database has committed the enquiry. The
 * staff alert is queued by a trigger in that same statement and delivered
 * after the response, so a slow email provider never delays the visitor.
 *
 * Browsers without JavaScript post the form directly; they get a redirect
 * back to the contact page instead of JSON.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

type Parsed = { body: Record<string, unknown>; isForm: boolean };

async function parse(request: Request): Promise<Parsed | null> {
  const type = request.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) return { body: await request.json(), isForm: false };
    if (type.includes('form')) {
      const form = await request.formData();
      return { body: Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])), isForm: true };
    }
  } catch { /* fall through */ }
  return null;
}

function respond(
  isForm: boolean,
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  if (isForm) {
    const url = new URL('/contact', 'http://placeholder');
    if (status === 201) url.searchParams.set('sent', String(body.reference));
    else url.searchParams.set('error', String(body.error ?? 'Something went wrong.'));
    return new NextResponse(null, { status: 303, headers: { Location: `${url.pathname}${url.search}#enquiry`, ...headers } });
  }
  return NextResponse.json(body, { status, headers });
}

export async function POST(request: Request) {
  const parsed = await parse(request);
  if (!parsed) return NextResponse.json({ error: 'Send the enquiry as JSON or a form.' }, { status: 415 });
  const { body, isForm } = parsed;

  // A hidden field real people never fill in. Accept quietly, store nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return respond(isForm, 202, { ok: true });
  }

  const limit = await rateLimit(`enquiry:${clientIp(request.headers)}`, MAX_PER_WINDOW, WINDOW_MS).catch(() => null);
  if (limit && !limit.ok) {
    return respond(isForm, 429,
      { error: 'Too many messages from this connection. Please try again later, or call us.' },
      { 'Retry-After': String(limit.retryAfterSeconds) });
  }

  const key = (request.headers.get('idempotency-key') ?? String(body.idempotencyKey ?? '')).trim();
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(key)) {
    return respond(isForm, 422, {
      error: 'This form has expired. Please reload the page and try again.',
      fields: { idempotencyKey: 'Missing or invalid Idempotency-Key.' },
    });
  }

  let db;
  let publishedIds: Set<number>;
  try {
    db = await getDb();
    const rows = await db.select({ id: properties.id }).from(properties).where(eq(properties.status, 'published'));
    publishedIds = new Set(rows.map((r) => r.id));
  } catch (e) {
    console.error('enquiry: database unavailable', e instanceof Error ? e.message : e);
    return respond(isForm, 503, { error: 'We could not save your message just now. Please call us instead.' });
  }

  const result = validateEnquiry(body, publishedIds);
  if (!result.ok) {
    const first = Object.values(result.errors)[0];
    return respond(isForm, 422, { error: first, fields: result.errors });
  }
  const data = result.data;
  const requestHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');

  try {
    const inserted = await db.insert(enquiries)
      .values({
        ...data,
        email: data.email ?? '',
        idempotencyKey: key,
        requestHash,
        sourcePage: String(body.sourcePage ?? '/contact').slice(0, 160),
        userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
      })
      .onConflictDoNothing({ target: enquiries.idempotencyKey })
      .returning({ id: enquiries.id, createdAt: enquiries.createdAt });

    if (inserted.length > 0) {
      const row = inserted[0];
      after(() => processOutbox(5).catch((e) => console.error('outbox after enquiry:', e)));
      return respond(isForm, 201, {
        reference: enquiryReference(row.id),
        receivedAt: row.createdAt.toISOString(),
      });
    }

    // Same key seen before: hand back the original receipt, unless the key is
    // being reused for a different enquiry.
    const [existing] = await db
      .select({ id: enquiries.id, createdAt: enquiries.createdAt, requestHash: enquiries.requestHash })
      .from(enquiries)
      .where(eq(enquiries.idempotencyKey, key))
      .limit(1);
    if (!existing) throw new Error('Idempotency conflict without a stored enquiry.');
    if (existing.requestHash !== requestHash) {
      return respond(isForm, 422, {
        error: 'This form was already used for a different message. Please reload the page and try again.',
        fields: { idempotencyKey: 'Key already used with different details.' },
      });
    }
    return respond(isForm, 201,
      { reference: enquiryReference(existing.id), receivedAt: existing.createdAt.toISOString() },
      { 'Idempotent-Replayed': 'true' });
  } catch (e) {
    // Log the failure without the visitor's details.
    console.error('enquiry insert failed:', e instanceof Error ? e.message : e);
    return respond(isForm, 503, { error: 'We could not save your message just now. Please call us instead.' });
  }
}
