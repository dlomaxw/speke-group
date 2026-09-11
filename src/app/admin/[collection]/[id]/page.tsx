import { notFound } from 'next/navigation';
import { eq, desc } from 'drizzle-orm';
import { getDb, getDynamicDb } from '@/db';
import { media } from '@/db/schema';
import { requirePermission } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getCollection } from '@/lib/collections';
import RecordForm from '@/components/RecordForm';

export const dynamic = 'force-dynamic';

export default async function EditRecord({
  params,
}: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params;
  const config = getCollection(collection);
  if (!config) notFound();

  const user = await requirePermission('content.edit');
  const db = await getDb();

  let record: Record<string, unknown> | null = null;
  if (id !== 'new') {
    const numeric = Number(id);
    if (!Number.isFinite(numeric)) notFound();
    const dyn = await getDynamicDb();
    const table = config.table;
    const [row] = await dyn.select().from(table).where(eq(table.id, numeric)).limit(1);
    if (!row) notFound();
    record = row as Record<string, unknown>;
  }

  const library = await db
    .select({ url: media.url, filename: media.filename, alt: media.alt })
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(60);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="serif text-[25px] font-semibold">
          {record ? `Edit ${config.singular.toLowerCase()}` : `New ${config.singular.toLowerCase()}`}
        </h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1">{config.description}</p>
      </div>

      <RecordForm
        collection={config.slug}
        collectionLabel={config.label}
        singular={config.singular}
        fields={config.fields}
        record={record}
        canPublish={can(user.role, 'content.publish')}
        mediaOptions={library}
      />
    </div>
  );
}
