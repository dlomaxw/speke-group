import { after } from 'next/server';
import { and, asc, desc, eq, inArray, isNull, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/db';
import { enquiries, outboxEvents, properties, users } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getAccess } from '@/lib/access';
import { enquiryReference, ENQUIRY_TYPES } from '@/lib/enquiry-rules';
import { emailConfigured, outboxSummary, processOutbox } from '@/lib/outbox';
import EnquiryRow from '@/components/EnquiryRow';
import AlertQueue from '@/components/AlertQueue';

export const dynamic = 'force-dynamic';

const STAGES = [
  { value: 'open', label: 'Open' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
  { value: 'spam', label: 'Spam' },
  { value: 'all', label: 'All' },
] as const;

const OPEN = ['new', 'assigned', 'contacted', 'qualified'] as const;

export default async function EnquiriesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string; property?: string }> }) {
  const user = await requirePermission('enquiries.view');
  const { status, property } = await searchParams;
  const active = STAGES.some((f) => f.value === status) ? status! : 'open';
  const access = await getAccess(user);
  const db = await getDb();

  // Nudge anything due in the alert queue whenever staff look at the inbox.
  after(() => processOutbox(10).catch((e) => console.error('outbox from inbox view:', e)));

  const propertyRows = await db.select({ id: properties.id, name: properties.name })
    .from(properties).orderBy(asc(properties.sortOrder));
  const visibleProperties = access.all ? propertyRows : propertyRows.filter((p) => access.propertyIds.has(p.id));
  const propertyFilter = property && /^\d+$/.test(property) ? Number(property)
    : property === 'group' ? 'group' : null;

  const where: SQL[] = [];
  if (active === 'open') where.push(inArray(enquiries.status, [...OPEN]));
  else if (active !== 'all') where.push(eq(enquiries.status, active as 'new'));
  if (!access.all) {
    const ids = [...access.propertyIds];
    where.push(ids.length ? inArray(enquiries.propertyId, ids) : eq(enquiries.id, -1));
  }
  if (propertyFilter === 'group') where.push(isNull(enquiries.propertyId));
  else if (typeof propertyFilter === 'number') where.push(eq(enquiries.propertyId, propertyFilter));

  const rows = await db.select().from(enquiries)
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(enquiries.createdAt))
    .limit(300);

  const staff = await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.isActive, true));
  const nameOf = new Map(propertyRows.map((p) => [p.id, p.name]));

  const alertRows = rows.length
    ? await db.select({ enquiryId: outboxEvents.enquiryId, state: outboxEvents.state, lastError: outboxEvents.lastError })
        .from(outboxEvents).where(inArray(outboxEvents.enquiryId, rows.map((r) => r.id)))
    : [];
  const alertOf = new Map(alertRows.map((a) => [a.enquiryId, a]));

  const summary = await outboxSummary();
  const problems = await db.select({
    id: outboxEvents.id, enquiryId: outboxEvents.enquiryId, state: outboxEvents.state,
    attempts: outboxEvents.attempts, lastError: outboxEvents.lastError, nextAttemptAt: outboxEvents.nextAttemptAt,
  })
    .from(outboxEvents)
    .where(or(eq(outboxEvents.state, 'failed'), eq(outboxEvents.state, 'pending')))
    .orderBy(desc(outboxEvents.id))
    .limit(50);

  const qs = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const next = { status: active, property: property ?? null, ...patch };
    for (const [k, v] of Object.entries(next)) if (v) p.set(k, v);
    return `/admin/enquiries?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-[25px] font-semibold">Enquiries</h1>
          <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[75ch]">
            Every message sent through the website. Move each one through the stages; a
            conversion needs the booking reference as evidence.
            {!access.all && ' You see enquiries for your assigned properties only.'}
          </p>
        </div>
        <a href={`/admin/enquiries/export?${new URLSearchParams({ status: active, ...(property ? { property } : {}) })}`}
           className="btn-ghost">
          Export CSV
        </a>
      </div>

      <AlertQueue
        configured={emailConfigured()}
        summary={summary}
        problems={problems.map((p) => ({
          id: p.id,
          reference: p.enquiryId ? enquiryReference(p.enquiryId) : '—',
          state: p.state, attempts: p.attempts, lastError: p.lastError,
          nextAttemptAt: p.nextAttemptAt.toISOString(),
        }))}
        canRetry={can(user.role, 'enquiries.manage')}
      />

      <div className="flex flex-wrap gap-2">
        {STAGES.map((f) => (
          <a
            key={f.value}
            href={qs({ status: f.value })}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold border transition-colors ${
              active === f.value
                ? 'bg-[color:var(--color-maroon)] border-[color:var(--color-maroon)] text-white'
                : 'bg-white border-[#d7dbe2] text-[#38414f] hover:border-[#b6bdc8]'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="status" value={active} />
        <label htmlFor="property" className="text-[12.5px] font-semibold text-[#38414f]">Property</label>
        <select id="property" name="property" defaultValue={property ?? ''} className="field max-w-[280px]">
          <option value="">{access.all ? 'All properties' : 'All my properties'}</option>
          {access.all && <option value="group">Group (no property chosen)</option>}
          {visibleProperties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit" className="btn-ghost">Filter</button>
      </form>

      {rows.length === 0 ? (
        <div className="card-surface p-8 text-center text-[14px] text-[#5a6474]">
          No enquiries here.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((e) => (
            <EnquiryRow
              key={e.id}
              enquiry={{
                id: e.id, reference: enquiryReference(e.id),
                name: e.name, email: e.email || null, phone: e.phone,
                subject: e.subject, message: e.message,
                kind: ENQUIRY_TYPES.find((t) => t.value === e.kind)?.label ?? e.kind,
                status: e.status, assignedTo: e.assignedTo, internalNote: e.internalNote,
                propertyName: e.propertyId ? nameOf.get(e.propertyId) ?? 'Unknown property' : 'Group',
                contactMethod: e.contactMethod, arrivalDate: e.arrivalDate, departureDate: e.departureDate,
                guests: e.guests, marketingOptIn: e.marketingOptIn,
                conversionReference: e.conversionReference,
                createdAt: e.createdAt.toISOString(),
                firstHumanReplyAt: e.firstHumanReplyAt?.toISOString() ?? null,
                alertState: alertOf.get(e.id)?.state ?? null,
              }}
              staff={staff}
              canManage={can(user.role, 'enquiries.manage')}
              canDelete={can(user.role, 'enquiries.delete')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
