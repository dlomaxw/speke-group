import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq, desc } from 'drizzle-orm';
import { getDb, getDynamicDb } from '@/db';
import { media, properties } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getCollection } from '@/lib/collections';
import { getAccess, covers, OUT_OF_SCOPE } from '@/lib/access';
import { listHistory, pendingFor, reviveSnapshot, diff } from '@/lib/versions';
import RecordForm from '@/components/RecordForm';
import VersionHistory from '@/components/VersionHistory';

export const dynamic = 'force-dynamic';

export default async function EditRecord({
  params,
}: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params;
  const config = getCollection(collection);
  if (!config) notFound();

  const user = await requirePermission('content.edit');
  const access = await getAccess(user);
  const db = await getDb();

  let record: Record<string, unknown> | null = null;
  let numericId: number | null = null;
  if (id !== 'new') {
    numericId = Number(id);
    if (!Number.isFinite(numericId)) notFound();
    const dyn = await getDynamicDb();
    const [row] = await dyn.select().from(config.table).where(eq(config.table.id, numericId)).limit(1);
    if (!row) notFound();
    record = row as Record<string, unknown>;
  }

  const ownerId = record && config.propertyField ? (record[config.propertyField] as number | null) : null;
  const allowed = access.all || (config.propertyField && (record ? covers(access, ownerId) : true));
  if (!allowed) {
    return (
      <div className="space-y-4 max-w-[640px]">
        <h1 className="serif text-[25px] font-semibold">Not available</h1>
        <p className="card-surface p-5 text-[14px] text-[#5a6474]">
          {config.propertyField ? OUT_OF_SCOPE : 'Only staff covering every property can change group-wide content.'}
        </p>
        <Link href={`/admin/${config.slug}`} className="btn-ghost inline-block">Back</Link>
      </div>
    );
  }

  const library = await db
    .select({ url: media.url, filename: media.filename, alt: media.alt })
    .from(media)
    .where(eq(media.rightsStatus, 'approved'))
    .orderBy(desc(media.createdAt))
    .limit(60);

  const propertyRows = await db.select({ id: properties.id, name: properties.name })
    .from(properties).orderBy(asc(properties.sortOrder));
  const propertyOptions = access.all ? propertyRows : propertyRows.filter((p) => access.propertyIds.has(p.id));

  const canPublish = can(user.role, 'content.publish');
  const pending = numericId ? await pendingFor(config.slug, numericId) : null;
  const pendingChanges = pending && record ? diff(record, reviveSnapshot(pending.data)) : [];
  const history = numericId ? await listHistory(config.slug, numericId) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-[25px] font-semibold">
            {record ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
          </h1>
          <p className="text-[13.5px] text-[#5a6474] mt-1">{config.description}</p>
        </div>
        <Link href="/admin/preview" className="btn-ghost">Preview the site</Link>
      </div>

      {pending && (
        <div className="rounded-xl border border-[#f0dcb0] bg-[#fff6e6] px-4 py-3 text-[13px] text-[#6b5527] space-y-1">
          <div className="font-semibold">
            Changes by {pending.userEmail ?? 'a colleague'} are waiting for approval
            ({pendingChanges.length} field{pendingChanges.length === 1 ? '' : 's'}).
          </div>
          <div>
            The form below shows what is live now. {canPublish
              ? <Link href="/admin/review" className="underline font-semibold">Review the change</Link>
              : 'Saving again replaces the waiting proposal.'}
          </div>
        </div>
      )}

      {record && record.status === 'published' && !canPublish && config.hasStatus && (
        <p className="text-[12.5px] text-[#5a6474]">
          This is live. Your edits go to a manager for approval before the public site changes.
        </p>
      )}

      <RecordForm
        collection={config.slug}
        collectionLabel={config.label}
        singular={config.singular}
        fields={config.fields}
        record={record}
        canPublish={canPublish}
        mediaOptions={library}
        propertyOptions={propertyOptions}
        allowGroupWide={access.all}
      />

      {numericId && (
        <VersionHistory
          versions={history.map((v) => ({
            id: v.id, action: v.action, state: v.state, userEmail: v.userEmail,
            createdAt: v.createdAt.toISOString(), note: v.note,
          }))}
          canRestore={canPublish}
        />
      )}
    </div>
  );
}
