/**
 * Seeds the Our Impact page from the sustainability review of October 2026.
 *
 * Every initiative below is something a Speke Group site already publishes.
 * None of it is independently verified, and the review found no measured,
 * group-wide footprint, so nothing here states a total, a percentage or a
 * reduction. Each card carries where the claim comes from, and the page says
 * plainly that measurement is still under way.
 *
 * Properties the review could not find specific evidence for are listed as
 * being assessed rather than left out, so the page is honest about its gaps.
 *
 *   npx tsx scripts/apply-impact.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-impact.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { impactInitiatives, properties, settings } from '../src/db/schema';

type Area = 'energy' | 'water' | 'waste' | 'sourcing' | 'nature' | 'community';
type Evidence = 'published' | 'verified' | 'assessing';

const INITIATIVES: {
  slug: string; title: string; property: string | null; area: Area;
  description: string; source: string; evidence: Evidence; sortOrder: number;
}[] = [
  {
    slug: 'srcc-solar', title: 'Solar lighting and water heating', property: 'speke-resort-convention-centre',
    area: 'energy', evidence: 'published', sortOrder: 1,
    description: 'Solar lighting and solar water heating, alongside efficient lighting and in-room power controls.',
    source: 'Published on the convention centre’s sustainability page. Coverage and measured savings are being confirmed.',
  },
  {
    slug: 'srcc-water', title: 'Water-saving fixtures and irrigation controls', property: 'speke-resort-convention-centre',
    area: 'water', evidence: 'published', sortOrder: 2,
    description: 'Water-saving fixtures indoors and controlled irrigation across the grounds.',
    source: 'Published on the convention centre’s sustainability page. Operating records are being gathered.',
  },
  {
    slug: 'srcc-composting', title: 'Food composting', property: 'speke-resort-convention-centre',
    area: 'waste', evidence: 'published', sortOrder: 3,
    description: 'Food waste from the kitchens and banqueting is composted rather than sent to landfill.',
    source: 'Published on the convention centre’s sustainability page. Weighed records are being gathered.',
  },
  {
    slug: 'srcc-local-sourcing', title: 'Local sourcing', property: 'speke-resort-convention-centre',
    area: 'sourcing', evidence: 'published', sortOrder: 4,
    description: 'Food and supplies bought locally where the kitchens can do so.',
    source: 'Published on the convention centre’s sustainability page. The purchasing share is being measured.',
  },
  {
    slug: 'munyonyo-clean-up', title: 'Community clean-up at Munyonyo', property: 'speke-resort-munyonyo',
    area: 'community', evidence: 'published', sortOrder: 5,
    description: 'Staff and residents cleaned the lakeside together in February 2026.',
    source: 'Reported February 2026. We are putting the programme on a regular footing and recording what is collected.',
  },
  {
    slug: 'kitante-solar-water', title: 'Solar-heated water', property: 'speke-apartments-kitante',
    area: 'energy', evidence: 'published', sortOrder: 6,
    description: 'Hot water for the apartments is heated by solar.',
    source: 'Listed on the property’s own website. System capacity and coverage are being confirmed.',
  },
  {
    slug: 'tagore-solar-water', title: 'Solar-heated water', property: 'tagore-apartments',
    area: 'energy', evidence: 'published', sortOrder: 7,
    description: 'Hot water for the apartments is heated by solar.',
    source: 'Listed on the property’s own website. System capacity and coverage are being confirmed.',
  },
  {
    slug: 'forest-cottages-setting', title: 'Built into the forest', property: 'forest-cottages-hotel',
    area: 'nature', evidence: 'published', sortOrder: 8,
    description: 'A boutique hotel built in harmony with its surroundings, with monkeys and over twenty bird species in the grounds.',
    source: 'Described on the property’s own website. Habitat and resource records are being assessed.',
  },
  {
    slug: 'kabira-grounds', title: 'Mature grounds and landscaping', property: 'kabira-country-club',
    area: 'nature', evidence: 'published', sortOrder: 9,
    description: 'Gardens and mature trees across the club’s grounds in Bukoto.',
    source: 'Described on the property’s own website. Energy, water, waste and biodiversity practices are being assessed.',
  },
  {
    slug: 'commonwealth-shared-measures', title: 'Shared environmental measures at Munyonyo', property: 'munyonyo-commonwealth-resort',
    area: 'energy', evidence: 'assessing', sortOrder: 10,
    description: 'The Munyonyo properties share services and present their environmental measures together. We are establishing which apply here specifically, and how shared utilities are allocated.',
    source: 'Shared resort brochure. Boundaries are being set before anything is reported as this property’s own.',
  },
  {
    slug: 'group-measurement', title: 'Measuring the whole collection', property: null,
    area: 'energy', evidence: 'assessing', sortOrder: 11,
    description: 'Twelve consecutive months of energy, water, waste and purchasing records are being collected from every property — including restaurants, laundries, pools, spas and event spaces — using the hotel industry’s HCMI and HWMI methods.',
    source: 'Our own programme, begun October 2026.',
  },
];

const COPY = [
  { key: 'impact_eyebrow', value: 'Our Impact', label: 'Impact eyebrow', valueType: 'text', sortOrder: 1 },
  { key: 'impact_title', value: 'A Warm Welcome. A Thought for Tomorrow.', label: 'Impact heading', valueType: 'text', sortOrder: 2 },
  { key: 'impact_lead', value: 'Uganda’s natural beauty is part of what makes a stay with us special. These are the environmental initiatives running at our properties today, and what we are doing to measure the rest.', label: 'Impact lead paragraph', valueType: 'textarea', sortOrder: 3 },
  { key: 'impact_footprint_title', value: 'Where We Stand Today', label: 'Footprint heading', valueType: 'text', sortOrder: 4 },
  { key: 'impact_footprint_body', value: 'We do not yet publish a group-wide environmental footprint, because we do not yet have one we can stand behind. Collecting twelve consecutive months of energy, water, waste and purchasing records from every property — including its restaurants, laundry, pools, spas and event facilities — is under way. Until that work is finished, this page describes what each property does rather than quoting totals or percentages.', label: 'Footprint paragraph', valueType: 'textarea', sortOrder: 5 },
  { key: 'impact_next_title', value: 'What We Are Doing Next', label: 'Next steps heading', valueType: 'text', sortOrder: 6 },
  { key: 'impact_guests_title', value: 'How You Can Take Part', label: 'Guest section heading', valueType: 'text', sortOrder: 7 },
  { key: 'impact_guests_body', value: 'Small choices during a stay add up across thirteen properties. Reuse your towels and linen when you are happy to, refill rather than replace bottles where refill points are provided, switch off air conditioning when you go out, and ask our team what is available at the property you are in — it differs from one to another, and they will tell you plainly.', label: 'Guest paragraph', valueType: 'textarea', sortOrder: 8 },
  { key: 'impact_home_title', value: 'A Warm Welcome. A Thought for Tomorrow.', label: 'Homepage impact heading', valueType: 'text', sortOrder: 40 },
  { key: 'impact_home_body', value: 'Uganda’s natural beauty is part of what makes a stay with us special. Practical environmental initiatives are running at selected properties — from solar water heating at Kitante and Tagore Apartments to water-saving systems and food composting at our Munyonyo convention centre.', label: 'Homepage impact paragraph', valueType: 'textarea', sortOrder: 41 },
];

/** The steps we have actually committed to, with no dates invented. */
const NEXT_STEPS = [
  { key: 'impact_step_1', value: 'Collect twelve consecutive months of energy, water, waste and purchasing records from every property, counting shared services at Munyonyo once and allocating them consistently.' },
  { key: 'impact_step_2', value: 'Calculate our footprint using the Hotel Carbon Measurement Initiative and Hotel Water Measurement Initiative, so our numbers can be compared with the rest of the industry.' },
  { key: 'impact_step_3', value: 'Assess the properties where this review found no specific environmental evidence, and publish what we find either way.' },
  { key: 'impact_step_4', value: 'Publish a baseline, then report progress against it — both annual totals and consumption per occupied room-night.' },
];

async function main() {
  const db = await getDb();
  console.log(`Applying impact content to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const c of [...COPY, ...NEXT_STEPS.map((s, i) => ({
    ...s, label: `Next step ${i + 1}`, valueType: 'textarea', sortOrder: 10 + i,
  }))]) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
    else await db.insert(settings).values({ ...c, group: 'impact' });
  }
  console.log(`  settings written: ${COPY.length + NEXT_STEPS.length}`);

  for (const i of INITIATIVES) {
    const { property, ...rest } = i;
    let propertyId: number | null = null;
    if (property) {
      const [p] = await db.select({ id: properties.id }).from(properties).where(eq(properties.slug, property));
      propertyId = p?.id ?? null;
      if (!propertyId) console.warn(`  ! no property "${property}"`);
    }
    const [existing] = await db.select({ id: impactInitiatives.id })
      .from(impactInitiatives).where(eq(impactInitiatives.slug, i.slug));
    if (existing) {
      await db.update(impactInitiatives).set({ ...rest, propertyId, updatedAt: new Date() })
        .where(eq(impactInitiatives.id, existing.id));
    } else {
      await db.insert(impactInitiatives).values({ ...rest, propertyId });
    }
  }
  console.log(`  initiatives written: ${INITIATIVES.length}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
