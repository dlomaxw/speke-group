import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { enquiries, users } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can } from '@/lib/rbac';
import EnquiryRow from '@/components/EnquiryRow';

export const dynamic = 'force-dynamic';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'answered', label: 'Answered' },
  { value: 'closed', label: 'Closed' },
  { value: 'spam', label: 'Spam' },
] as const;

export default async function EnquiriesPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const user = await requirePermission('enquiries.view');
  const { status } = await searchParams;
  const active = FILTERS.some((f) => f.value === status) ? status! : 'all';

  const db = await getDb();
  const base = db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
  const rows = active === 'all'
    ? await base
    : await db.select().from(enquiries)
        .where(eq(enquiries.status, active as 'new'))
        .orderBy(desc(enquiries.createdAt));

  const staff = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.isActive, true));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="serif text-[25px] font-semibold">Enquiries</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1">
          Every message sent through the website contact form. Assign one to a colleague and mark it off once answered.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <a
            key={f.value}
            href={`/admin/enquiries?status=${f.value}`}
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

      {rows.length === 0 ? (
        <div className="card-surface p-8 text-center text-[14px] text-[#5a6474]">
          No enquiries {active === 'all' ? 'yet' : `marked ${active}`}.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((e) => (
            <EnquiryRow
              key={e.id}
              enquiry={{
                id: e.id, name: e.name, email: e.email, phone: e.phone,
                subject: e.subject, message: e.message, kind: e.kind,
                status: e.status, assignedTo: e.assignedTo,
                internalNote: e.internalNote,
                createdAt: e.createdAt.toISOString(),
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
