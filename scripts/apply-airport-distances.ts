/**
 * Road distance and drive time from Entebbe International Airport to each
 * property, measured once with OSRM on 8 October 2026 and stored, so the site
 * never depends on a routing service at request time.
 *
 * These are road distances without traffic. The page says so rather than
 * presenting them as journey times.
 *
 *   npx tsx scripts/apply-airport-distances.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-airport-distances.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, settings } from '../src/db/schema';

/** slug: [kilometres by road, minutes without traffic] */
const ROUTES: Record<string, [number, number]> = {
  'speke-hotel': [38.9, 42],
  'kabira-country-club': [47.2, 45],
  'forest-cottages-hotel': [47.6, 45],
  'dolphin-suites-hotel': [43.7, 49],
  'speke-resort-munyonyo': [37.2, 42],
  'munyonyo-commonwealth-resort': [37.2, 42],
  'speke-resort-convention-centre': [37.2, 42],
  'speke-apartments-wampewo': [40.4, 44],
  'speke-apartments-kitante': [45.5, 43],
  'boulevard-suites': [39.3, 43],
  'bukoto-heights': [46.8, 44],
  'tagore-apartments': [46.1, 43],
  'naguru-apartments': [49.2, 48],
};

const COPY = [
  { key: 'airport_name', value: 'Entebbe International Airport', label: 'Airport name', valueType: 'text', sortOrder: 24 },
  { key: 'airport_lat', value: '0.0390733', label: 'Airport latitude', valueType: 'text', sortOrder: 25 },
  { key: 'airport_lng', value: '32.4540530', label: 'Airport longitude', valueType: 'text', sortOrder: 26 },
  { key: 'map_body', value: 'Thirteen addresses, from the city centre to the shores of Lake Victoria — with the road distance from Entebbe International Airport to each one.', label: 'Locations map paragraph', valueType: 'textarea', sortOrder: 23 },
];

async function main() {
  const db = await getDb();
  console.log(`Applying airport distances to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
    else await db.insert(settings).values({ ...c, group: 'homepage' });
  }

  let done = 0;
  for (const [slug, [km, minutes]] of Object.entries(ROUTES)) {
    const res = await db.update(properties)
      .set({ airportKm: km, airportMinutes: minutes, updatedAt: new Date() })
      .where(eq(properties.slug, slug))
      .returning({ id: properties.id });
    if (!res.length) console.warn(`  ! no property "${slug}"`);
    else done++;
  }
  console.log(`  properties measured: ${done}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
