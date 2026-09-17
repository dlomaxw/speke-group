import 'server-only';
import { and, asc, eq, inArray, lt, lte, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { enquiries, outboxEvents, properties, settings } from '@/db/schema';
import { enquiryReference } from './enquiry-rules';

/**
 * Delivers queued staff alerts.
 *
 * Each event is claimed with a conditional update before it is worked on, so
 * two runs at the same moment cannot both send it. Failures retry with
 * exponential backoff and jitter; after MAX_ATTEMPTS the event is marked
 * failed and shows in the dashboard for someone to retry by hand.
 *
 * The alert carries the reference, property, type, dates and a dashboard
 * link — not the guest's contact details or message, which stay in the
 * dashboard behind sign-in.
 */

const MAX_ATTEMPTS = 8;
const STALE_MS = 10 * 60 * 1000;

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ALERT_FROM_EMAIL);
}

function backoffMs(attempts: number) {
  const base = Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 6 * 60 * 60 * 1000);
  return Math.round(base * (0.5 + Math.random() * 0.5));
}

function dashboardUrl() {
  const base =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');
  return `${base.replace(/\/$/, '')}/admin/enquiries`;
}

async function recipients() {
  const db = await getDb();
  const [row] = await db.select({ value: settings.value }).from(settings)
    .where(eq(settings.key, 'enquiry_notify_email')).limit(1);
  return (row?.value ?? '')
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
}

async function sendAlert(eventKey: string, enquiryId: number) {
  const db = await getDb();
  const [row] = await db
    .select({
      id: enquiries.id, kind: enquiries.kind, arrivalDate: enquiries.arrivalDate,
      departureDate: enquiries.departureDate, guests: enquiries.guests,
      contactMethod: enquiries.contactMethod, createdAt: enquiries.createdAt,
      propertyName: properties.name,
    })
    .from(enquiries)
    .leftJoin(properties, eq(enquiries.propertyId, properties.id))
    .where(eq(enquiries.id, enquiryId))
    .limit(1);
  if (!row) return; // deleted since; nothing to tell anyone

  const to = await recipients();
  if (to.length === 0) throw new Error('No valid alert recipients in Site settings (enquiry alerts).');

  const ref = enquiryReference(row.id);
  const property = row.propertyName ?? 'Group (no property chosen)';
  const dates = row.arrivalDate
    ? `${row.arrivalDate} to ${row.departureDate ?? '?'}`
    : 'Not given';
  const lines = [
    `A new website enquiry is waiting in the dashboard.`,
    ``,
    `Reference: ${ref}`,
    `Property: ${property}`,
    `Type: ${row.kind}`,
    `Dates: ${dates}`,
    `Guests: ${row.guests ?? 'Not given'}`,
    `Preferred contact: ${row.contactMethod}`,
    ``,
    `Open it: ${dashboardUrl()}`,
    ``,
    `Contact details and the message are only shown in the dashboard.`,
  ];

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      // The provider drops a repeat with the same key, so a retry after a
      // lost response cannot send the alert twice.
      'Idempotency-Key': eventKey,
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM_EMAIL,
      to,
      subject: `New enquiry ${ref} · ${property}`,
      text: lines.join('\n'),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Email provider returned ${res.status}${body ? `: ${body.slice(0, 160)}` : ''}`);
  }
}

export async function processOutbox(limit = 10) {
  const db = await getDb();
  const now = new Date();

  // Anything left "processing" by a run that died goes back in the queue.
  await db.update(outboxEvents)
    .set({ state: 'pending', updatedAt: now })
    .where(and(eq(outboxEvents.state, 'processing'), lt(outboxEvents.updatedAt, new Date(now.getTime() - STALE_MS))));

  if (!emailConfigured()) return { configured: false as const, sent: 0, failed: 0 };

  const due = await db.select().from(outboxEvents)
    .where(and(eq(outboxEvents.state, 'pending'), lte(outboxEvents.nextAttemptAt, now)))
    .orderBy(asc(outboxEvents.id))
    .limit(limit);

  let sent = 0;
  let failed = 0;
  for (const event of due) {
    const claimed = await db.update(outboxEvents)
      .set({ state: 'processing', attempts: sql`${outboxEvents.attempts} + 1`, updatedAt: new Date() })
      .where(and(eq(outboxEvents.id, event.id), eq(outboxEvents.state, 'pending')))
      .returning({ attempts: outboxEvents.attempts });
    if (claimed.length === 0) continue; // another run took it

    const attempts = Number(claimed[0].attempts);
    try {
      if (event.type === 'enquiry.notify' && event.enquiryId) {
        await sendAlert(event.eventKey, event.enquiryId);
      }
      await db.update(outboxEvents)
        .set({ state: 'sent', sentAt: new Date(), lastError: null, updatedAt: new Date() })
        .where(eq(outboxEvents.id, event.id));
      sent++;
    } catch (e) {
      const message = (e instanceof Error ? e.message : 'Unknown error').slice(0, 300);
      const giveUp = attempts >= MAX_ATTEMPTS;
      await db.update(outboxEvents)
        .set({
          state: giveUp ? 'failed' : 'pending',
          lastError: message,
          nextAttemptAt: new Date(Date.now() + backoffMs(attempts)),
          updatedAt: new Date(),
        })
        .where(eq(outboxEvents.id, event.id));
      if (giveUp) failed++;
      console.error(`outbox event ${event.id} attempt ${attempts} failed: ${message}`);
    }
  }
  return { configured: true as const, sent, failed };
}

/** Puts failed (or waiting) events straight back at the front of the queue. */
export async function retryEvents(ids: number[]) {
  if (ids.length === 0) return;
  const db = await getDb();
  await db.update(outboxEvents)
    .set({ state: 'pending', attempts: 0, nextAttemptAt: new Date(), updatedAt: new Date() })
    .where(and(inArray(outboxEvents.id, ids), inArray(outboxEvents.state, ['failed', 'pending'])));
}

export async function outboxSummary() {
  const db = await getDb();
  const rows = await db
    .select({ state: outboxEvents.state, n: sql<number>`count(*)` })
    .from(outboxEvents)
    .groupBy(outboxEvents.state);
  const out = { pending: 0, processing: 0, sent: 0, failed: 0 };
  for (const r of rows) out[r.state] = Number(r.n);
  return out;
}
