import { and, eq, isNull } from 'drizzle-orm';
import type { getDb } from '@/db';
import { properties, venues, restaurants, offers, newsPosts } from '@/db/schema';

type Db = Awaited<ReturnType<typeof getDb>>;

/**
 * Which property owns each piece of seeded content. Only links the content
 * itself gives evidence for are listed; anything unclear stays group-wide
 * (no property) until someone who knows sets it in the dashboard.
 */
const VENUE_LOCATIONS: Record<string, string> = {
  'Kabira Country Club': 'kabira-country-club',
  'Speke Resort': 'speke-resort-munyonyo',
  'Speke Resort Convention Centre': 'speke-resort-convention-centre',
  'Munyonyo Commonwealth Resort': 'munyonyo-commonwealth-resort',
};

const DINING_SLUGS: Record<string, string> = {
  'the-stables': 'speke-resort-munyonyo',
  'lake-grill': 'speke-resort-munyonyo',
  'forest-cottages-bar': 'forest-cottages-hotel',
  'heights-bar-cafe': 'bukoto-heights',
};

const LABELS: Record<string, string> = {
  'Speke Resort': 'speke-resort-munyonyo',
  'Speke Resort Munyonyo': 'speke-resort-munyonyo',
  'Kabira Country Club': 'kabira-country-club',
  'Bukoto Heights': 'bukoto-heights',
  'Speke Apartments Kitante': 'speke-apartments-kitante',
  'Dolphin Suites': 'dolphin-suites-hotel',
  'Convention Centre': 'speke-resort-convention-centre',
};

/** Fills empty property links from the maps above. Never overwrites a link staff have set. */
export async function linkContentToProperties(db: Db) {
  const rows = await db.select({ id: properties.id, slug: properties.slug }).from(properties);
  const idOf = new Map(rows.map((r) => [r.slug, r.id]));
  let linked = 0;

  const link = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    table: any, column: any, values: Record<string, string>,
  ) => {
    for (const [value, slug] of Object.entries(values)) {
      const propertyId = idOf.get(slug);
      if (!propertyId) continue;
      const res = await db.update(table)
        .set({ propertyId })
        .where(and(eq(column, value), isNull(table.propertyId)))
        .returning({ id: table.id });
      linked += res.length;
    }
  };

  await link(venues, venues.location, VENUE_LOCATIONS);
  await link(restaurants, restaurants.slug, DINING_SLUGS);
  await link(offers, offers.propertyLabel, LABELS);
  await link(newsPosts, newsPosts.propertyLabel, LABELS);
  return linked;
}

