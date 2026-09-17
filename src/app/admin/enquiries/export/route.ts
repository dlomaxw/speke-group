import { and, desc, eq, inArray, isNull, notInArray, type SQL } from 'drizzle-orm';
import { getDb } from '@/db';
import { enquiries, outboxEvents, properties, users } from '@/db/schema';
import { getSession, logActivity } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getAccess } from '@/lib/access';
import { enquiryReference } from '@/lib/enquiry-rules';
import { mfaRequiredFor } from '@/lib/mfa';

export const dynamic = 'force-dynamic';

/**
 * CSV export for reconciliation. Defaults to unresolved enquiries (not
 * converted, lost or spam). Signed-in staff only, limited to their properties,
 * and every export is written to the activity log.
 */

/** Stops a spreadsheet treating a cell as a formula. */
function cell(value: unknown) {
  let s = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const user = await getSession();
  if (!user || !can(user.role, 'enquiries.view') || (mfaRequiredFor(user.role) && !user.totpEnabled)) {
    return new Response('Not allowed', { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'open';
  const property = url.searchParams.get('property');
  const access = await getAccess(user);
  const db = await getDb();

  const where: SQL[] = [];
  if (status === 'open') where.push(notInArray(enquiries.status, ['converted', 'lost', 'spam']));
  else if (status !== 'all') where.push(eq(enquiries.status, status as 'new'));
  if (!access.all) {
    const ids = [...access.propertyIds];
    where.push(ids.length ? inArray(enquiries.propertyId, ids) : eq(enquiries.id, -1));
  }
  if (property === 'group') where.push(isNull(enquiries.propertyId));
  else if (property && /^\d+$/.test(property)) where.push(eq(enquiries.propertyId, Number(property)));

  const rows = await db
    .select({
      e: enquiries,
      propertyName: properties.name,
      ownerName: users.name,
      alertState: outboxEvents.state,
    })
    .from(enquiries)
    .leftJoin(properties, eq(enquiries.propertyId, properties.id))
    .leftJoin(users, eq(enquiries.assignedTo, users.id))
    .leftJoin(outboxEvents, eq(outboxEvents.enquiryId, enquiries.id))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(enquiries.createdAt));

  const header = [
    'reference', 'received_at', 'stage', 'property', 'type', 'name', 'email', 'phone', 'reply_by',
    'arrival', 'departure', 'guests', 'marketing_opt_in', 'owner', 'first_human_reply_at',
    'closed_at', 'booking_reference', 'staff_alert', 'subject', 'message',
  ];
  const lines = [header.map(cell).join(',')];
  for (const { e, propertyName, ownerName, alertState } of rows) {
    lines.push([
      enquiryReference(e.id), e.createdAt, e.status, propertyName ?? 'Group', e.kind, e.name, e.email, e.phone,
      e.contactMethod, e.arrivalDate, e.departureDate, e.guests, e.marketingOptIn ? 'yes' : 'no', ownerName,
      e.firstHumanReplyAt, e.closedAt, e.conversionReference, alertState, e.subject, e.message,
    ].map(cell).join(','));
  }

  await logActivity(user, 'exported', 'enquiries', undefined, `${rows.length} rows (${status})`);

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="speke-enquiries-${status}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
