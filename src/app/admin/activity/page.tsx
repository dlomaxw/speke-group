import { desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { activityLog } from '@/db/schema';
import { requirePermission } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  await requirePermission('activity.view');
  const db = await getDb();
  const rows = await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(200);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="serif text-[25px] font-semibold">Activity log</h1>
        <p className="text-[13.5px] text-[#5a6474] mt-1 max-w-[70ch]">
          Who changed what, most recent first. Useful when something on the site looks different
          and nobody remembers touching it.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="card-surface p-8 text-center text-[14px] text-[#5a6474]">Nothing recorded yet.</div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f9fafb] border-b border-[#e6e9ee]">
                  {['When', 'Who', 'Did what', 'To', 'Detail'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#5a6474] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-[#eef1f5] last:border-0">
                    <td className="px-4 py-2.5 text-[12.5px] text-[#5a6474] whitespace-nowrap">
                      {a.createdAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2.5 text-[13px]">{a.userEmail ?? 'Unknown'}</td>
                    <td className="px-4 py-2.5 text-[13px] capitalize">{a.action}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#5a6474]">{a.entity}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#7a8494]">{a.summary ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
