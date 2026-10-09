/**
 * Rebuilds the venues from what each property publishes about its own rooms.
 *
 * The meeting rooms at Munyonyo come from srcc-ug.com/venues/ — the Convention
 * Centre's own site, read 9 October 2026 — and the capacity chart it and the
 * two resorts publish as a PDF. They agree with each other. An older directory
 * at spekegroup.com/meeting-venues/ disagrees with both, and earlier seeds of
 * this site followed it, which is where the wrong figures came from: it gives
 * Royal Palm 150 guests in 260 sq m where the Convention Centre gives 600 in
 * 600, and puts every Munyonyo room under "Speke Resort" rather than the
 * building that actually holds it.
 *
 * Each room is filed under the property whose block the Convention Centre says
 * it sits in, so the Commonwealth Block rooms belong to the Commonwealth and
 * the rest to the Convention Centre. Speke Resort Munyonyo keeps its gardens
 * and lawns in the wedding list below: its meeting space is the Centre.
 *
 * Kabira's halls come from kabiracountryclub.com, which is the only site that
 * publishes them.
 *
 * Two rows are deliberately absent. The Convention Centre lists a "Katwe Board
 * room" at 160 guests in 150 sq m, where the capacity chart has a 30 sq m
 * boardroom seating 20; the two cannot both be right, so it waits for the
 * Group. Nalubaale is given the chart's 30 sq m rather than the venues page's
 * 73, which is the figure that page also gives the room above it.
 *
 * Photographs are each venue's own, from the same sites, in public/images.
 *
 *   npx tsx scripts/apply-venues.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-venues.ts
 */
import { eq, notInArray } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { properties, venues } from '../src/db/schema';

const KABIRA = (hall: string) =>
  `https://kabiracountryclub.com/conference-halls/indoor-events-ever/${hall}/`;
const GROUP = (page: string) => `https://spekegroup.com/${page}/`;
/** The Convention Centre lists all its rooms on one page. */
const SRCC = 'https://srcc-ug.com/venues/';

type Row = {
  slug: string; name: string; property: string; location: string;
  capacity: string; venueSize: string | null; venueUrl: string;
};

/**
 * The wedding venues, from the outdoor capacity chart published on
 * munyonyocommonwealth.com/wedding/ and the Group's own wedding pages.
 *
 * The two ballrooms carry their banquet and cocktail capacity, not the theatre
 * seating the meeting cards show, because that is what a wedding is set for.
 *
 * Only rooms the Group publishes both a wedding page and a photograph for are
 * here; the chart's other rows (the Lakeside A/B split, the Upper Lakeside and
 * Wedding Chapel gardens, Marina Garden) have neither, so they are left for the
 * team to add rather than illustrated with someone else's photograph.
 *
 * One conflict worth knowing: the wedding chart gives Speke Ballroom Gardens
 * 2,736 Sq m at 57 x 48 m, which is the row the formal capacity chart gives to
 * Mango Gardens. Mango Garden below carries those figures; Speke Ballroom
 * Gardens is left out until the Group says which is which.
 */
const WEDDINGS: Row[] = [
  { slug: 'lakeside', name: 'Lakeside', property: 'speke-resort-munyonyo',
    location: 'Speke Resort Munyonyo', capacity: 'Up to 5,000 guests', venueSize: '14,400 Sq m',
    venueUrl: GROUP('lakeside-wedding') },
  { slug: 'flagmast-garden', name: 'Flagmast Garden', property: 'speke-resort-munyonyo',
    location: 'Speke Resort Munyonyo', capacity: 'Up to 2,500 guests', venueSize: '5,766 Sq m',
    venueUrl: GROUP('flagmast-garden-wedding') },
  { slug: 'upper-peacehub-gardens', name: 'Upper Peacehub Gardens', property: 'munyonyo-commonwealth-resort',
    location: 'Munyonyo Commonwealth Resort', capacity: 'Up to 1,500 guests', venueSize: '5,400 Sq m',
    venueUrl: GROUP('peace-hub-wedding') },
  { slug: 'speke-ballroom-wedding', name: 'Speke Ballroom', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: 'Up to 800 guests seated', venueSize: '1,140 Sq m',
    venueUrl: GROUP('speke-ballroom-weddings') },
  { slug: 'victoria-ballroom-wedding', name: 'Victoria Ballroom', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: 'Up to 650 guests seated', venueSize: '957 Sq m',
    venueUrl: GROUP('victoria-ballroom-weddings') },
  { slug: 'lower-peacehub-garden', name: 'Lower Peacehub Garden', property: 'munyonyo-commonwealth-resort',
    location: 'Munyonyo Commonwealth Resort', capacity: 'Up to 1,000 guests', venueSize: '6,480 Sq m',
    venueUrl: GROUP('lower-peace-hub') },
  { slug: 'mango-garden', name: 'Mango Garden', property: 'speke-resort-munyonyo',
    location: 'Speke Resort Munyonyo', capacity: 'Up to 800 guests', venueSize: '2,736 Sq m',
    venueUrl: GROUP('mango-garden-wedding') },
  { slug: 'kabira-ballroom-wedding', name: 'Kabira Ballroom', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: 'Up to 500 guests', venueSize: null,
    venueUrl: KABIRA('ballroom') },
  { slug: 'speke-resort-poolside', name: 'Speke Resort Poolside', property: 'speke-resort-munyonyo',
    location: 'Speke Resort Munyonyo', capacity: 'Up to 300 guests', venueSize: '1,500 Sq m',
    venueUrl: GROUP('speke-poolside') },
  { slug: 'commonwealth-banquet-hall-wedding', name: 'Commonwealth Banquet Hall', property: 'munyonyo-commonwealth-resort',
    location: 'Munyonyo Commonwealth Resort', capacity: 'Up to 200 guests', venueSize: '330 Sq m',
    venueUrl: GROUP('commonweealth-banquet-hall-weddings') },
];

/** Listed largest first, so the opening cards are not all one property. */
const VENUES: Row[] = [
  { slug: 'rwenzori-hall', name: 'Rwenzori Hall A & B', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '3,200 guests', venueSize: '3,200 Sq m',
    venueUrl: SRCC },
  { slug: 'speke-ballroom', name: 'Speke Ballroom', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '1,400 guests', venueSize: '1,140 Sq m',
    venueUrl: SRCC },
  { slug: 'victoria-ballroom', name: 'Victoria Ballroom', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '900 guests', venueSize: '957 Sq m',
    venueUrl: SRCC },
  { slug: 'royal-palm-hall', name: 'Royal Palm', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '600 guests', venueSize: '600 Sq m',
    venueUrl: SRCC },
  { slug: 'gallery-1-2', name: 'Gallery 1 & 2', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '500 guests', venueSize: '500 Sq m',
    venueUrl: SRCC },
  { slug: 'albert-hall', name: 'Albert', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '250 guests', venueSize: '262 Sq m',
    venueUrl: SRCC },
  { slug: 'commonwealth-banquet-hall', name: 'Commonwealth Banquet Hall', property: 'munyonyo-commonwealth-resort',
    location: 'Munyonyo Commonwealth Resort', capacity: '250 guests', venueSize: '332 Sq m',
    venueUrl: SRCC },
  { slug: 'sheena-hall', name: 'Sheena', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '175 guests', venueSize: '242 Sq m',
    venueUrl: SRCC },
  { slug: 'meera-hall', name: 'Meera', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '175 guests', venueSize: '242 Sq m',
    venueUrl: SRCC },
  { slug: 'bunyonyi-hall', name: 'Bunyonyi Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '170 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'bujagali-hall', name: 'Bujagali Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '170 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'kidepo-hall', name: 'Kidepo Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '160 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'semuliki-hall', name: 'Semuliki Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '160 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'mburo-hall', name: 'Mburo Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '160 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'ebony-hall', name: 'Ebony', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '140 guests', venueSize: '228 Sq m',
    venueUrl: SRCC },
  { slug: 'jacaranda-hall', name: 'Jacaranda', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '140 guests', venueSize: '228 Sq m',
    venueUrl: SRCC },
  { slug: 'mahogany-hall', name: 'Mahogany', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '140 guests', venueSize: '228 Sq m',
    venueUrl: SRCC },
  { slug: 'majestic-hall', name: 'Majestic', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '140 guests', venueSize: '228 Sq m',
    venueUrl: SRCC },
  { slug: 'acacia-hall', name: 'Acacia', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '130 guests', venueSize: '227.5 Sq m',
    venueUrl: SRCC },
  { slug: 'kibale-hall', name: 'Kibale Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '120 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'bwindi-hall', name: 'Bwindi Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '120 guests', venueSize: '170 Sq m',
    venueUrl: SRCC },
  { slug: 'kabalega-hall', name: 'Kabalega Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '120 guests', venueSize: '150 Sq m',
    venueUrl: SRCC },
  { slug: 'regal-hall', name: 'Regal', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '95 guests', venueSize: '126 Sq m',
    venueUrl: SRCC },
  { slug: 'royal-hall', name: 'Royal Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '95 guests', venueSize: '126 Sq m',
    venueUrl: SRCC },
  { slug: 'kalangala', name: 'Kalangala', property: 'munyonyo-commonwealth-resort',
    location: 'Munyonyo Commonwealth Resort', capacity: '50 guests', venueSize: '84 Sq m',
    venueUrl: SRCC },
  { slug: 'royal-club', name: 'Royal Club', property: 'munyonyo-commonwealth-resort',
    location: 'Munyonyo Commonwealth Resort', capacity: '40 guests', venueSize: '107 Sq m',
    venueUrl: SRCC },
  { slug: 'sapphire', name: 'Sapphire', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '35 guests', venueSize: '62 Sq m',
    venueUrl: SRCC },
  { slug: 'amethyst', name: 'Amethyst', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '35 guests', venueSize: '58 Sq m',
    venueUrl: SRCC },
  { slug: 'sanga', name: 'Sanga', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '24 guests', venueSize: '34 Sq m',
    venueUrl: SRCC },
  { slug: 'emerald-hall', name: 'Emerald Hall', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '20 guests', venueSize: '73 Sq m',
    venueUrl: SRCC },
  { slug: 'nalubaale-boardroom', name: 'Nalubaale Boardroom', property: 'speke-resort-convention-centre',
    location: 'Speke Resort Convention Centre', capacity: '20 guests', venueSize: '30 Sq m',
    venueUrl: SRCC },
  { slug: 'kabira-ballroom', name: 'Kabira Ballroom', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: '400 guests', venueSize: null,
    venueUrl: KABIRA('ballroom') },
  { slug: 'palm', name: 'Palm', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: '120 guests', venueSize: null,
    venueUrl: KABIRA('palm') },
  { slug: 'pine', name: 'Pine', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: '80 guests', venueSize: null,
    venueUrl: KABIRA('best-indoor-events') },
  { slug: 'acacia', name: 'Acacia', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: '50 guests', venueSize: null,
    venueUrl: KABIRA('acacia') },
  { slug: 'jacaranda', name: 'Jacaranda', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: '35 guests', venueSize: null,
    venueUrl: KABIRA('jacaranda') },
  { slug: 'oak', name: 'Oak', property: 'kabira-country-club',
    location: 'Kabira Country Club', capacity: '35 guests', venueSize: null,
    venueUrl: KABIRA('oak') },
];


/** The chips on the events page, keyed off the largest number in the capacity. */
function sizeTag(capacity: string): string {
  const most = Math.max(...(capacity.match(/[\d,]+/g) ?? ['0']).map((n) => Number(n.replace(/,/g, ''))));
  if (most > 400) return 's1000';
  if (most > 100) return 's120';
  if (most > 35) return 's50';
  return 's10';
}

async function main() {
  const db = await getDb();
  console.log(`Applying meeting venues to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const props = await db.select({ id: properties.id, slug: properties.slug }).from(properties);
  const idOf = (slug: string) => props.find((p) => p.slug === slug)?.id ?? null;

  let i = 0;
  for (const v of [...VENUES, ...WEDDINGS]) {
    const kind = VENUES.includes(v) ? 'meeting' as const : 'wedding' as const;
    i += 1;
    const propertyId = idOf(v.property);
    if (!propertyId) console.warn(`  ! no property "${v.property}" for ${v.slug}`);
    const row = {
      name: v.name, propertyId, location: v.location, capacity: v.capacity,
      venueSize: v.venueSize, sizeTag: sizeTag(v.capacity), venueUrl: v.venueUrl, kind,
      imageUrl: `/images/v-${v.slug}.webp`, imageAlt: `${v.name}, ${v.location}`,
      sortOrder: i, status: 'published' as const, updatedAt: new Date(),
    };
    const [existing] = await db.select({ id: venues.id }).from(venues).where(eq(venues.slug, v.slug));
    if (existing) await db.update(venues).set(row).where(eq(venues.id, existing.id));
    else await db.insert(venues).values({ slug: v.slug, ...row });
  }
  console.log(`  meeting venues: ${VENUES.length}, wedding venues: ${WEDDINGS.length}`);

  // Rooms that are no longer in the published directory are retired, not deleted,
  // so nothing a colleague added by hand disappears without trace.
  const keep = [...VENUES, ...WEDDINGS].map((v) => v.slug);
  const retired = await db.update(venues)
    .set({ status: 'draft', updatedAt: new Date() })
    .where(notInArray(venues.slug, keep))
    .returning({ slug: venues.slug });
  if (retired.length) console.log(`  retired: ${retired.map((r) => r.slug).join(', ')}`);

  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
