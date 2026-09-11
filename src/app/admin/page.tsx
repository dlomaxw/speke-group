import Link from 'next/link';
import { sql, desc, eq } from 'drizzle-orm';
import { getDb, getDynamicDb } from '@/db';
import {
  properties, venues, restaurants, experiences, newsPosts,
  offers, enquiries, media, activityLog,
} from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { can, ROLE_BLURB } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

async function countRows(table: unknown, where?: unknown) {
  const db = await getDynamicDb();
  const q = db.select({ n: sql<number>`count(*)::int` }).from(table);
  const [row] = where ? await q.where(where) : await q;
  return Number(row?.n ?? 0);
}

export default async function Overview({
  searchParams,
}: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const db = await getDb();

  const [nProps, nVenues, nDining, nExp, nNews, nDrafts, nOffers, nMedia, nNew] =
    await Promise.all([
      countRows(properties),
      countRows(venues),
      countRows(restaurants),
      countRows(experiences),
      countRows(newsPosts, eq(newsPosts.status, 'published')),
      countRows(newsPosts, eq(newsPosts.status, 'draft')),
      countRows(offers),
      countRows(media),
      countRows(enquiries, eq(enquiries.status, 'new')),
    ]);

  const recentEnquiries = can(user.role, 'enquiries.view')
    ? await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(5)
    : [];

  const recentActivity = can(user.role, 'activity.view')
    ? await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(8)
    : [];

  const tiles = [
    { label: 'Properties', value: nProps, href: '/admin/properties' },
    { label: 'Meeting venues', value: nVenues, href: '/admin/venues' },
    { label: 'Restaurants & bars', value: nDining, href: '/admin/restaurants' },
    { label: 'Experiences', value: nExp, href: '/admin/experiences' },
    { label: 'Published stories', value: nNews, href: '/admin/news' },
    { label: 'Draft stories', value: nDrafts, href: '/admin/news' },
    { label: 'Offers', value: nOffers, href: '/admin/offers' },
    { label: 'Media files', value: nMedia, href: '/admin/media' },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="serif text-[27px] font-semibold">
          Good to see you, {user.name.split(' ')[0]}
        </h1>
        <p className="text-[14px] text-[#5a6474] mt-1">{ROLE_BLURB[user.role]}</p>
      </div>

      {denied && (
        <p role="alert" className="text-[13px] text-[#8a5a00] bg-[#fff6e6] border border-[#f0dcb0] rounded-lg px-3 py-2">
          Your role does not allow that action. Ask a manager or IT if you need access.
        </p>
      )}

      {can(user.role, 'enquiries.view') && nNew > 0 && (
        <Link
          href="/admin/enquiries"
          className="block card-surface p-4 border-l-4 border-l-[color:var(--color-gold)] hover:shadow-sm transition-shadow"
        >
          <div className="font-semibold text-[15px]">
            {nNew} new {nNew === 1 ? 'enquiry' : 'enquiries'} waiting
          </div>
          <div className="text-[13px] text-[#5a6474] mt-0.5">
            From the contact form on the website.
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card-surface p-4 hover:shadow-sm transition-shadow">
            <div className="serif text-[28px] font-bold leading-none">{t.value}</div>
            <div className="text-[12px] text-[#5a6474] mt-1.5">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {can(user.role, 'enquiries.view') && (
          <section className="card-surface p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-semibold text-[15px]">Latest enquiries</h2>
              <Link href="/admin/enquiries" className="text-[12.5px] text-[color:var(--color-maroon)] font-semibold">
                See all
              </Link>
            </div>
            {recentEnquiries.length === 0 ? (
              <p className="text-[13px] text-[#7a8494]">
                Nothing yet. Messages from the website contact form land here.
              </p>
            ) : (
              <ul className="divide-y divide-[#eef1f5]">
                {recentEnquiries.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate">{e.name}</div>
                      <div className="text-[12.5px] text-[#5a6474] truncate">
                        {e.subject || e.message.slice(0, 60)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10.5px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${
                        e.status === 'new'
                          ? 'bg-[#fff1cf] text-[#7a5c00]'
                          : 'bg-[#eef1f5] text-[#5a6474]'
                      }`}
                    >
                      {e.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {can(user.role, 'activity.view') && (
          <section className="card-surface p-5">
            <h2 className="font-semibold text-[15px] mb-3">Recent changes</h2>
            {recentActivity.length === 0 ? (
              <p className="text-[13px] text-[#7a8494]">No changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-[#eef1f5]">
                {recentActivity.map((a) => (
                  <li key={a.id} className="py-2 text-[13px]">
                    <span className="font-medium">{a.userEmail ?? 'Someone'}</span>{' '}
                    <span className="text-[#5a6474]">
                      {a.action} {a.entity}
                    </span>
                    {a.summary ? <span className="text-[#7a8494]"> — {a.summary}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
