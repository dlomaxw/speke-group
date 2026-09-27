/**
 * Records each property's own booking engine, as published on its own website
 * on 27 September 2026. The booking bar sends guests straight there.
 *
 * Properties with no engine of their own (the convention centre, which is an
 * events venue, and Naguru, which is booked through the office) are left empty
 * and fall back to the enquiry form.
 *
 *   npx tsx scripts/apply-booking-links.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-booking-links.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties } from '../src/db/schema';

const SWIFT = (id: string) => `https://www.swiftbook.io/inst/#/home?propertyId=${id}`;

/** Each id was opened and checked against the property it belongs to. */
const LINKS: Record<string, string | null> = {
  'speke-hotel': SWIFT('13494'),
  'kabira-country-club': SWIFT('722MTegHVNcMxQpzQlsKIWLqtkWMoRI49saBqb7Y3MzNjY=&JDRN=Y'),
  'forest-cottages-hotel': SWIFT('13398'),
  'dolphin-suites-hotel': SWIFT('13492'),
  'speke-resort-munyonyo': SWIFT('13491'),
  // The Commonwealth's own site books through the Munyonyo desk.
  'munyonyo-commonwealth-resort': SWIFT('13491'),
  'speke-apartments-wampewo': SWIFT('7557'),
  'speke-apartments-kitante': SWIFT('13365'),
  'boulevard-suites': SWIFT('13634'),
  'bukoto-heights': SWIFT('7821'),
  'tagore-apartments': 'https://live.ipms247.com/booking/book-rooms-tagoreapartments',
  // Booked through our own team rather than an engine of their own.
  'speke-resort-convention-centre': null,
  'naguru-apartments': null,
};

async function main() {
  const db = await getDb();
  console.log(`Applying booking links to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);
  for (const [slug, url] of Object.entries(LINKS)) {
    const res = await db.update(properties)
      .set({ bookingUrl: url, updatedAt: new Date() })
      .where(eq(properties.slug, slug))
      .returning({ id: properties.id });
    if (!res.length) console.warn(`  ! no property "${slug}"`);
    else console.log(`  ${slug}: ${url ? 'linked' : 'cleared (enquiry form)'}`);
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
