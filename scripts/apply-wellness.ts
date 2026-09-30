/**
 * Seeds the wellness facilities the homepage lists by location, and the copy
 * that introduces them.
 *
 * Only facilities the Group's own published copy states are listed here. The
 * rest are added from the dashboard, under "Spas, salons & gyms".
 *
 *   npx tsx scripts/apply-wellness.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-wellness.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { settings, wellness, properties } from '../src/db/schema';

const COPY = [
  { key: 'wellness_title', value: 'Spa & Wellness',
    label: 'Wellness heading', valueType: 'text', sortOrder: 1 },
  { key: 'wellness_body', value: 'Massages, facials and steam baths, hair and beauty salons, gyms and pools — choose a location to see what is on offer there.',
    label: 'Wellness paragraph', valueType: 'textarea', sortOrder: 2 },
];

const FACILITIES: {
  slug: string; name: string; property: string | null; kind: 'spa' | 'salon' | 'gym' | 'pool';
  description: string; highlights: string; location?: string; imageUrl: string; imageAlt: string; sortOrder: number;
}[] = [
  {
    slug: 'wampewo-spa', name: 'The Spa at Speke Apartments', property: 'speke-apartments-wampewo', kind: 'spa',
    description: 'Massages, facials and steam baths that combine original active ingredients with memorable fragrances, a few minutes from the central business district.',
    highlights: 'Body massage · Facials · Steam bath',
    location: 'Speke Apartments Wampewo, Kololo',
    imageUrl: '/images/l-spa.webp', imageAlt: 'Treatment room at the spa', sortOrder: 1,
  },
  {
    slug: 'wampewo-fitness-centre', name: 'Fitness Centre', property: 'speke-apartments-wampewo', kind: 'gym',
    description: 'A fitness centre with modern equipment and professional trainers, alongside the pools at Speke Apartments Wampewo.',
    highlights: 'Aerobics · Body building · Personal training',
    location: 'Speke Apartments Wampewo, Kololo',
    imageUrl: '/images/l-gym.webp', imageAlt: 'Fitness centre with cardio equipment', sortOrder: 2,
  },
];

async function main() {
  const db = await getDb();
  console.log(`Applying wellness content to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
    else await db.insert(settings).values({ ...c, group: 'homepage' });
  }
  console.log(`  settings written: ${COPY.length}`);

  for (const f of FACILITIES) {
    const { property, ...rest } = f;
    let propertyId: number | null = null;
    if (property) {
      const [p] = await db.select({ id: properties.id }).from(properties).where(eq(properties.slug, property));
      propertyId = p?.id ?? null;
      if (!propertyId) console.warn(`  ! no property "${property}" — listing ${f.slug} as group-wide`);
    }
    const [existing] = await db.select({ id: wellness.id }).from(wellness).where(eq(wellness.slug, f.slug));
    if (existing) {
      await db.update(wellness).set({ ...rest, propertyId, updatedAt: new Date() }).where(eq(wellness.id, existing.id));
      console.log(`  updated ${f.slug}`);
    } else {
      await db.insert(wellness).values({ ...rest, propertyId });
      console.log(`  inserted ${f.slug}`);
    }
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
