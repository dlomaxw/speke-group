/**
 * The leisure a guest can actually do at a property, alongside the spas and
 * gyms already listed. Every line here restates what the Group's own
 * experiences copy says; nothing new is claimed.
 *
 *   npx tsx scripts/apply-experiences-home.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-experiences-home.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, settings, wellness } from '../src/db/schema';

const FACILITIES: {
  slug: string; name: string; property: string; kind: 'spa' | 'salon' | 'gym' | 'pool' | 'equestrian' | 'marina';
  description: string; highlights: string; location: string; imageUrl: string; imageAlt: string; sortOrder: number;
}[] = [
  {
    slug: 'munyonyo-marina', name: 'Marina, Fishing & Boat Trips', property: 'speke-resort-munyonyo', kind: 'marina',
    description: 'The largest privately owned marina in Uganda, shared with Munyonyo Commonwealth Resort, offering boat cruises, water safaris and fishing excursions on Lake Victoria.',
    highlights: 'Fishing · Boat cruises · Water safaris · Bird watching',
    location: 'Speke Resort Munyonyo, Lake Victoria',
    imageUrl: '/images/l-marina.webp', imageAlt: 'Boats at the Munyonyo marina', sortOrder: 3,
  },
  {
    slug: 'munyonyo-equestrian', name: 'Horse Riding & Pony Camp', property: 'speke-resort-munyonyo', kind: 'equestrian',
    description: 'Show-quality ponies and experienced trainers year round. The Pony Camp runs for children aged 6 to 17, from beginners to advanced riders, with a small teacher-to-student ratio.',
    highlights: 'Pony camp · Pony rides · Grooming and horsemanship',
    location: 'Speke Resort Munyonyo',
    imageUrl: '/images/l-equestrian.webp', imageAlt: 'Ponies at the Munyonyo stables', sortOrder: 4,
  },
  {
    slug: 'kabira-fitness', name: 'Gym & Health Club', property: 'kabira-country-club', kind: 'gym',
    description: 'A gym with modern equipment and professional trainers at Kabira Country Club, alongside the swimming pool, sauna and steam bath.',
    highlights: 'Gym access · Swimming pool · Sauna and steam bath',
    location: 'Kabira Country Club, Bukoto',
    imageUrl: '/images/l-gym.webp', imageAlt: 'The gym at Kabira Country Club', sortOrder: 5,
  },
  {
    slug: 'munyonyo-pools', name: 'Lakeside Pools', property: 'speke-resort-munyonyo', kind: 'pool',
    description: 'Lounge by the pool with a drink in hand, or sit under a grass-thatched roof for whole Tilapia and burgers beside Lake Victoria.',
    highlights: 'Poolside dining · Olympic-size pool',
    location: 'Speke Resort Munyonyo',
    imageUrl: '/images/l-pools.webp', imageAlt: 'The pool at Speke Resort Munyonyo', sortOrder: 6,
  },
];

const COPY = [
  { key: 'wellness_title', value: 'Experiences & Wellness', label: 'Experiences heading', valueType: 'text', sortOrder: 1 },
  { key: 'wellness_body', value: 'Spas and salons, gyms and pools, horse riding and the lake — choose a location to see what is on offer there.', label: 'Experiences paragraph', valueType: 'textarea', sortOrder: 2 },
  { key: 'food_eyebrow', value: 'Food & Beverage', label: 'Food eyebrow', valueType: 'text', sortOrder: 50 },
  { key: 'food_title', value: 'Cooked to Order, Served with Care', label: 'Food heading', valueType: 'text', sortOrder: 51 },
  { key: 'food_body', value: 'Our kitchens take a contemporary but authentic approach to Continental, Asian and African cooking — grills by the lake, Indian and Brazilian kitchens, and classic cocktails to go with them.', label: 'Food paragraph', valueType: 'textarea', sortOrder: 52 },
];

async function main() {
  const db = await getDb();
  console.log(`Applying experiences and food copy to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
    else await db.insert(settings).values({ ...c, group: 'homepage' });
  }
  console.log(`  settings written: ${COPY.length}`);

  for (const f of FACILITIES) {
    const { property, ...rest } = f;
    const [p] = await db.select({ id: properties.id }).from(properties).where(eq(properties.slug, property));
    if (!p) { console.warn(`  ! no property "${property}"`); continue; }
    const [existing] = await db.select({ id: wellness.id }).from(wellness).where(eq(wellness.slug, f.slug));
    if (existing) {
      await db.update(wellness).set({ ...rest, propertyId: p.id, updatedAt: new Date() }).where(eq(wellness.id, existing.id));
      console.log(`  updated ${f.slug}`);
    } else {
      await db.insert(wellness).values({ ...rest, propertyId: p.id });
      console.log(`  inserted ${f.slug}`);
    }
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
