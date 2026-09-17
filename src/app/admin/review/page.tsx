import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { getDynamicDb } from '@/db';
import { requirePermission } from '@/lib/auth';
import { getCollection } from '@/lib/collections';
import { allPending, diff, reviveSnapshot } from '@/lib/versions';
import ReviewItem from '@/components/ReviewItem';

export const dynamic = 'force-dynamic';

function show(value: unknown) {
  if (value == null || value === '') return '(empty)';
  const s = String(value);
  return s.length > 240 ? `${s.slice(0, 240)}…` : s;
}

export default async function ReviewPage() {
  await requirePermission('content.publish');
  const pending = await allPending();
  const dyn = await getDynamicDb();

  const items = [];
  for (const p of pending) {
    const config = getCollection(p.collection);
    if (!config || p.recordId == null) continue;
    const [current] = await dyn.select().from(config.table).where(eq(config.table.id, p.recordId)).limit(1);
    const proposed = reviveSnapshot(p.data);
    const labelFor = (name: string) => config.fields.find((f) => f.name === name)?.label ?? name;
    items.push({
      id: p.id,
      collectionLabel: config.singular,
      href: `/admin/${config.slug}/${p.recordId}`,
      title: String(proposed.name ?? proposed.title ?? `#${p.recordId}`),
      by: p.userEmail ?? 'unknown',
      at: p.createdAt.toISOString(),
      deleted: !current,
      changes: current
        ? diff(current as Record<string, unknown>, proposed).map((c) => ({
            field: labelFor(c.field), before: show(c.before), after: show(c.after),
          }))
        : [],
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-[25px] font-semibold">Changes to approve</h1>
          <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[75ch]">
            Edits made to live content by staff who cannot publish. Nothing changes on the public
            site until you approve. Use preview to see every waiting change on the real pages first.
          </p>
        </div>
        <Link href="/admin/preview" className="btn-ghost">Preview on phone and desktop</Link>
      </div>

      {items.length === 0 ? (
        <div className="card-surface p-8 text-center text-[14px] text-[#5a6474]">Nothing waiting for approval.</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => <ReviewItem key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
