/**
 * Seeds the awards strip, the FAQ page and the pins on the locations map.
 *
 * The awards are the two the Group supplied in September 2026. The answers
 * below only state what the site already says elsewhere — anything about
 * rates, check-in times or policies is left to the team to add.
 *
 * Coordinates: most came from OpenStreetMap's record of the property itself.
 * The ones marked "street" are the road or landmark the property sits on,
 * which is close but not the door — the team can nudge those in the
 * dashboard, and every card also links to directions by name.
 *
 *   npx tsx scripts/apply-awards-faqs-map.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-awards-faqs-map.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { awards, faqs, properties, settings } from '../src/db/schema';

const AWARDS = [
  {
    slug: 'luxe-global-2026', title: 'World’s Best Luxury Convention Resort',
    organisation: 'Luxe Global Awards', year: '2026',
    property: 'speke-resort-convention-centre',
    description: 'Speke Resort Convention Centre secured the top global title, the first time the award has come to Uganda.',
    sortOrder: 1,
  },
  {
    slug: 'iapco-2026', title: 'Official IAPCO Convention Centre Partner',
    organisation: 'International Association of Professional Congress Organisers',
    year: 'July 2026', property: 'speke-resort-convention-centre',
    description: 'A historic move for East African hospitality: the centre joined IAPCO, connecting it to a global network of international event organisers.',
    sortOrder: 2,
  },
];

const FAQS: { question: string; answer: string; category: 'booking' | 'stay' | 'events' | 'group'; sortOrder: number }[] = [
  { category: 'booking', sortOrder: 1,
    question: 'How do I book a room or an apartment?',
    answer: 'Choose a property in the booking bar at the top of the homepage, pick your dates and select Check Availability. That takes you straight to the booking system for that property, where you can see rates and confirm. You can also send us an enquiry and our reservations team will come back to you.' },
  { category: 'booking', sortOrder: 2,
    question: 'Can I book more than one property at once?',
    answer: 'Each property is booked through its own system. If you are arranging a group, a long stay or rooms across several of our properties, send us an enquiry with the details and our team will put it together for you.' },
  { category: 'booking', sortOrder: 3,
    question: 'Which currencies can I pay in?',
    answer: 'We work in Uganda Shillings and US Dollars. Rates are shown in the booking system for the property you choose, where you can switch between currencies.' },
  { category: 'stay', sortOrder: 4,
    question: 'Where are your properties?',
    answer: 'All of them are in and around Kampala: hotels in the city centre and Bukoto, serviced apartments in Kololo, Kitante, Bukoto, Naguru and on Mawanda Road, and our resorts on the shores of Lake Victoria at Munyonyo. The map on this site shows each one, with directions.' },
  { category: 'stay', sortOrder: 5,
    question: 'Do you have serviced apartments for a long stay?',
    answer: 'Yes. Speke Apartments Wampewo and Kitante, Boulevard Suites, Bukoto Heights, Tagore Apartments and Naguru Apartments are furnished one, two and three bedroom apartments suited to long and short stays. Tell us your dates and we will suggest the right one.' },
  { category: 'stay', sortOrder: 6,
    question: 'Do you have a spa, a salon or a gym?',
    answer: 'Yes. The Spa, Experience and Wellness section on the homepage lists our wellness facilities, and you can choose a location to see what is available there.' },
  { category: 'events', sortOrder: 7,
    question: 'Can you host a conference or a wedding?',
    answer: 'Yes. We have forty-five conference and banqueting spaces across the Group, from boardrooms for ten to ballrooms for over a thousand guests. On the Events and Meetings page you can filter the venues by location and by the size of your party.' },
  { category: 'events', sortOrder: 8,
    question: 'How do I get a quote for an event?',
    answer: 'Send us an enquiry with your dates, the number of guests and what you have in mind, and our events team will come back to you with options and a proposal.' },
  { category: 'group', sortOrder: 9,
    question: 'How many properties does Speke Group have?',
    answer: 'Thirteen: four hotels, two resorts, a convention centre and six serviced apartment buildings, with over nine hundred guest rooms and apartments between them.' },
  { category: 'group', sortOrder: 10,
    question: 'How do I reach the right property?',
    answer: 'Every property is listed on this site with its own website and contact details, and our head office on Kampala Road can point you to the right team. The contact page has the full directory.' },
];

/**
 * slug: [latitude, longitude, how the point was established]
 *   'venue'  — OpenStreetMap's record of the property itself
 *   'street' — the road or landmark it sits on, so the pin is close but not
 *              the door; every card also links to directions by name
 * OpenStreetMap holds one record for the Munyonyo lakefront, so the resort,
 * the Commonwealth and the convention centre share it.
 */
const PINS: Record<string, [number, number, 'venue' | 'street']> = {
  'speke-hotel': [0.31524, 32.58289, 'venue'],
  'kabira-country-club': [0.34963, 32.60010, 'venue'],
  'forest-cottages-hotel': [0.34867, 32.60269, 'venue'],
  'dolphin-suites-hotel': [0.31189, 32.61909, 'venue'],
  'speke-resort-munyonyo': [0.23732, 32.62415, 'venue'],
  'munyonyo-commonwealth-resort': [0.23732, 32.62415, 'venue'],
  'speke-resort-convention-centre': [0.23732, 32.62415, 'venue'],
  'speke-apartments-wampewo': [0.32299, 32.59625, 'street'],
  'speke-apartments-kitante': [0.33346, 32.58032, 'street'],
  'boulevard-suites': [0.31380, 32.58038, 'street'],
  'bukoto-heights': [0.34805, 32.59432, 'venue'],
  'tagore-apartments': [0.33892, 32.58557, 'venue'],
  'naguru-apartments': [0.34191, 32.60637, 'street'],
};

const COPY = [
  { key: 'awards_title', value: 'Recognised Beyond Our Borders', label: 'Awards heading', valueType: 'text', sortOrder: 20 },
  { key: 'awards_body', value: 'Our work has been recognised internationally, and by the organisations that bring the world’s events to Uganda.', label: 'Awards paragraph', valueType: 'textarea', sortOrder: 21 },
  { key: 'map_title', value: 'Find Us Across Kampala', label: 'Locations map heading', valueType: 'text', sortOrder: 22 },
  { key: 'map_body', value: 'Thirteen addresses, from the city centre to the shores of Lake Victoria.', label: 'Locations map paragraph', valueType: 'textarea', sortOrder: 23 },
];

async function main() {
  const db = await getDb();
  console.log(`Applying awards, FAQs and map pins to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
    else await db.insert(settings).values({ ...c, group: 'homepage' });
  }
  console.log(`  settings written: ${COPY.length}`);

  for (const a of AWARDS) {
    const { property, ...rest } = a;
    const [p] = await db.select({ id: properties.id }).from(properties).where(eq(properties.slug, property));
    const [existing] = await db.select({ id: awards.id }).from(awards).where(eq(awards.slug, a.slug));
    if (existing) {
      await db.update(awards).set({ ...rest, propertyId: p?.id ?? null, updatedAt: new Date() }).where(eq(awards.id, existing.id));
      console.log(`  updated award ${a.slug}`);
    } else {
      await db.insert(awards).values({ ...rest, propertyId: p?.id ?? null });
      console.log(`  inserted award ${a.slug}`);
    }
  }

  // The questions are keyed on their text, so re-running does not duplicate them.
  for (const f of FAQS) {
    const [existing] = await db.select({ id: faqs.id }).from(faqs).where(eq(faqs.question, f.question));
    if (existing) await db.update(faqs).set({ ...f, updatedAt: new Date() }).where(eq(faqs.id, existing.id));
    else await db.insert(faqs).values(f);
  }
  console.log(`  FAQs written: ${FAQS.length}`);

  let pinned = 0;
  for (const [slug, [lat, lng]] of Object.entries(PINS)) {
    const res = await db.update(properties)
      .set({ latitude: lat, longitude: lng, updatedAt: new Date() })
      .where(eq(properties.slug, slug))
      .returning({ id: properties.id });
    pinned += res.length;
  }
  console.log(`  properties pinned: ${pinned}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
