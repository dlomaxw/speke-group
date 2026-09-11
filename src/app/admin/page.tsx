import Link from 'next/link';
import { sql, desc, eq, isNotNull, and } from 'drizzle-orm';
import { getDb, getDynamicDb } from '@/db';
import {
  properties, venues, restaurants, experiences, newsPosts,
  offers, enquiries, media, activityLog,
} from '@/db/schema';
import { requireUser } from '@/lib/auth';
import { can, ROLE_BLURB } from '@/lib/rbac';
import {
  StackedShare, Columns, Meters, StatusBreakdown, HeroFigure,
} from '@/components/charts/Charts';

export const dynamic = 'force-dynamic';

async function countRows(table: unknown, where?: unknown) {
  const db = await getDynamicDb();
  const q = db.select({ n: sql<number>`count(*)::int` }).from(table);
  const [row] = where ? await q.where(where) : await q;
  return Number(row?.n ?? 0);
}

/** Groups the last eight weeks of enquiries into columns. */
function weeklyBuckets(dates: Date[]) {
  const now = new Date();
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { start, end, value: 0 };
  }).reverse();

  for (const d of dates) {
    const hit = weeks.find((w) => d > w.start && d <= w.end);
    if (hit) hit.value += 1;
  }

  return weeks.map((w) => ({
    label: w.end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    value: w.value,
  }));
}

export default async function Overview({
  searchParams,
}: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireUser();
  const { denied } = await searchParams;
  const db = await getDb();

  const [
    nProps, nVenues, nDining, nExp, nNews, nDrafts, nOffers, nMedia, nNewEnq,
  ] = await Promise.all([
    countRows(properties), countRows(venues), countRows(restaurants),
    countRows(experiences),
    countRows(newsPosts, eq(newsPosts.status, 'published')),
    countRows(newsPosts, eq(newsPosts.status, 'draft')),
    countRows(offers), countRows(media),
    countRows(enquiries, eq(enquiries.status, 'new')),
  ]);

  // Portfolio split by kind, for the part-to-whole bar.
  const kindRows = await db
    .select({ kind: properties.kind, n: sql<number>`count(*)::int` })
    .from(properties)
    .groupBy(properties.kind);

  const KIND_LABEL: Record<string, string> = {
    hotel: 'Hotels', resort: 'Resorts',
    convention: 'Convention Centre', apartment: 'Apartments',
  };
  const portfolioMix = ['hotel', 'resort', 'convention', 'apartment'].map((k) => ({
    label: KIND_LABEL[k],
    value: Number(kindRows.find((r) => r.kind === k)?.n ?? 0),
  }));

  // How much of the site actually has a photo attached.
  const withPhoto = async (table: unknown, col: unknown) =>
    countRows(table, and(isNotNull(col as never), sql`${col} <> ''`));

  const [propsPhoto, venuesPhoto, diningPhoto, expPhoto, newsPhoto] = await Promise.all([
    withPhoto(properties, properties.imageUrl),
    withPhoto(venues, venues.imageUrl),
    withPhoto(restaurants, restaurants.imageUrl),
    withPhoto(experiences, experiences.imageUrl),
    withPhoto(newsPosts, newsPosts.imageUrl),
  ]);
  const nNewsAll = nNews + nDrafts;

  // Enquiries
  const canSeeEnquiries = can(user.role, 'enquiries.view');
  const allEnquiries = canSeeEnquiries
    ? await db.select({ createdAt: enquiries.createdAt, status: enquiries.status }).from(enquiries)
    : [];
  const weekly = weeklyBuckets(allEnquiries.map((e) => e.createdAt));
  const statusRows = ['new', 'assigned', 'answered', 'closed', 'spam'].map((s) => ({
    status: s,
    count: allEnquiries.filter((e) => e.status === s).length,
  }));

  const recentEnquiries = canSeeEnquiries
    ? await db.select().from(enquiries).orderBy(desc(enquiries.createdAt)).limit(4)
    : [];
  const recentActivity = can(user.role, 'activity.view')
    ? await db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(6)
    : [];

  const tiles = [
    { label: 'Properties', value: nProps, href: '/admin/properties' },
    { label: 'Meeting venues', value: nVenues, href: '/admin/venues' },
    { label: 'Restaurants & bars', value: nDining, href: '/admin/restaurants' },
    { label: 'Experiences', value: nExp, href: '/admin/experiences' },
    { label: 'Offers', value: nOffers, href: '/admin/offers' },
    { label: 'Media files', value: nMedia, href: '/admin/media' },
  ];

  return (
    <div className="space-y-6">
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

      {/* Lead with the two numbers that prompt action */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canSeeEnquiries && (
          <Link href="/admin/enquiries" className="contents">
            <HeroFigure
              value={nNewEnq}
              label={nNewEnq === 1 ? 'Enquiry waiting' : 'Enquiries waiting'}
              sub={nNewEnq === 0 ? 'Nothing needs a reply' : 'From the website contact form'}
            />
          </Link>
        )}
        <Link href="/admin/news" className="contents">
          <HeroFigure
            value={nDrafts}
            label={nDrafts === 1 ? 'Story in draft' : 'Stories in draft'}
            sub={nDrafts === 0 ? 'Nothing waiting to publish' : 'Waiting for a manager to publish'}
          />
        </Link>

        <StackedShare
          title="Portfolio mix"
          caption="The thirteen properties by type."
          data={portfolioMix}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Meters
          title="Photo coverage"
          caption="Sections still missing pictures look unfinished on the public site."
          rows={[
            { label: 'Properties', done: propsPhoto, total: nProps },
            { label: 'Meeting venues', done: venuesPhoto, total: nVenues },
            { label: 'Restaurants & bars', done: diningPhoto, total: nDining },
            { label: 'Experiences', done: expPhoto, total: nExp },
            { label: 'News stories', done: newsPhoto, total: nNewsAll },
          ]}
        />

        {canSeeEnquiries ? (
          <Columns
            title="Enquiries, last eight weeks"
            caption="Each column is one week, most recent on the right."
            data={weekly}
            emptyNote="No enquiries in the last eight weeks."
          />
        ) : (
          <Meters
            title="Published content"
            caption="What is live on the site right now."
            rows={[{ label: 'News stories', done: nNews, total: nNewsAll }]}
          />
        )}
      </div>

      {canSeeEnquiries && (
        <StatusBreakdown
          title="Enquiries by status"
          caption="Anything sitting in New needs somebody to pick it up."
          rows={statusRows}
        />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card-surface p-4 hover:shadow-sm transition-shadow">
            <div className="serif text-[26px] font-bold leading-none">{t.value}</div>
            <div className="text-[12px] text-[#5a6474] mt-1.5">{t.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {canSeeEnquiries && (
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
                    <span className={`shrink-0 text-[10.5px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${
                      e.status === 'new' ? 'bg-[#fff6e3] text-[#7a5c00]' : 'bg-[#eef1f5] text-[#4b5565]'
                    }`}>
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
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-semibold text-[15px]">Recent changes</h2>
              <Link href="/admin/activity" className="text-[12.5px] text-[color:var(--color-maroon)] font-semibold">
                See all
              </Link>
            </div>
            {recentActivity.length === 0 ? (
              <p className="text-[13px] text-[#7a8494]">No changes recorded yet.</p>
            ) : (
              <ul className="divide-y divide-[#eef1f5]">
                {recentActivity.map((a) => (
                  <li key={a.id} className="py-2 text-[13px]">
                    <span className="font-medium">{a.userEmail ?? 'Someone'}</span>{' '}
                    <span className="text-[#5a6474]">{a.action} {a.entity}</span>
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
