import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, desc } from 'drizzle-orm';
import { getDynamicDb } from '@/db';
import { requireUser } from '@/lib/auth';
import { can } from '@/lib/rbac';
import { getCollection } from '@/lib/collections';
import RowActions from '@/components/RowActions';

export const dynamic = 'force-dynamic';

function cell(value: unknown) {
  if (value == null || value === '') return '—';
  if (value instanceof Date) return value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const s = String(value);
  return s.length > 70 ? s.slice(0, 70) + '…' : s;
}

export default async function CollectionList({
  params,
}: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const config = getCollection(collection);
  if (!config) notFound();

  const user = await requireUser();
  const db = await getDynamicDb();
  const table = config.table;

  const sortColumn =
    config.defaultSort === 'publishedAt' ? table.publishedAt
    : config.defaultSort === 'name' ? table.name
    : table.sortOrder;

  const rows = (await db
    .select()
    .from(table)
    .orderBy(config.defaultSort === 'publishedAt' ? desc(sortColumn) : asc(sortColumn))
  ) as Record<string, unknown>[];

  const labelFor = (name: string) =>
    config.fields.find((f) => f.name === name)?.label ?? name;

  const mayEdit = can(user.role, 'content.edit');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-[25px] font-semibold">{config.label}</h1>
          <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[70ch]">{config.description}</p>
        </div>
        {mayEdit && (
          <Link href={`/admin/${config.slug}/new`} className="btn-primary">
            Add {config.singular.toLowerCase()}
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card-surface p-8 text-center">
          <p className="text-[14px] text-[#5a6474]">Nothing here yet.</p>
          {mayEdit && (
            <Link href={`/admin/${config.slug}/new`} className="btn-primary inline-block mt-3">
              Add the first one
            </Link>
          )}
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[#e6e9ee]">
                  {config.listFields.map((f) => (
                    <th key={f} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#5a6474] whitespace-nowrap">
                      {labelFor(f)}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 w-px" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={String(row.id)} className="border-b border-[#eef1f5] last:border-0 hover:bg-[#fafbfc]">
                    {config.listFields.map((f, i) => (
                      <td key={f} className="px-4 py-2.5 text-[13.5px] align-middle">
                        {f === 'status' ? (
                          <span className={`text-[10.5px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${
                            row.status === 'published'
                              ? 'bg-[#e6f4ea] text-[#1e6b34]'
                              : 'bg-[#fff1cf] text-[#7a5c00]'
                          }`}>
                            {String(row.status)}
                          </span>
                        ) : i === 0 && mayEdit ? (
                          <Link href={`/admin/${config.slug}/${row.id}`}
                                className="font-medium text-[color:var(--color-maroon)] hover:underline">
                            {cell(row[f])}
                          </Link>
                        ) : (
                          <span className="text-[#38414f]">{cell(row[f])}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <RowActions
                        collection={config.slug}
                        id={Number(row.id)}
                        status={config.hasStatus ? (row.status as 'draft' | 'published') : undefined}
                        canEdit={mayEdit}
                        canDelete={can(user.role, 'content.delete')}
                        canPublish={can(user.role, 'content.publish')}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!can(user.role, 'content.publish') && config.hasStatus && (
        <p className="text-[12.5px] text-[#7a8494]">
          You can create and edit here. A manager or administrator publishes changes to the live site.
        </p>
      )}
    </div>
  );
}
