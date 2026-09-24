/**
 * Applies the copy Speke Group supplied on 24 September 2026: the rewritten
 * About page, the new milestones, and the removal of broad claims from the
 * homepage, footer and the Speke Hotel description.
 *
 *   npx tsx scripts/apply-copy-2026-09.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-copy-2026-09.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { settings, milestones, properties } from '../src/db/schema';
import { ABOUT_SETTINGS } from '../src/lib/about-content';

/** Homepage, footer and general wording, with the broad claims removed. */
const SITE_COPY: { key: string; value: string; label?: string; group?: string; valueType?: string; sortOrder?: number }[] = [
  { key: 'hero_title', value: 'Distinctive Places Across Uganda' },
  { key: 'hero_title_accent', value: 'One Warm Welcome' },
  { key: 'hero_body', value: 'Hotels, resorts, serviced apartments and event venues, each with its own character and the same attentive service.' },
  { key: 'story_title', value: 'A Collection Built on Ugandan Hospitality' },
  { key: 'story_body', value: 'Our story began with Speke Hotel, a historic Kampala landmark, acquired in 1996. Since then the collection has grown to include lakeside resorts, city hotels, serviced apartments and venues for meetings and celebrations across Uganda.' },
  { key: 'site_tagline', value: 'Hotels, resorts, serviced apartments and event venues across Uganda.' },
  { key: 'founded_year', value: '1996', label: 'Welcoming guests since', group: 'general', valueType: 'text', sortOrder: 5 },
];

const MILESTONES = [
  { year: '1920s', title: 'A Kampala Landmark', sortOrder: 1,
    description: 'Speke Hotel opens in central Kampala, beginning a history of welcoming visitors to the city.' },
  { year: '1996', title: 'A New Chapter', sortOrder: 2,
    description: 'Dr. Sudhir Ruparelia acquires Speke Hotel, laying the foundation for the group’s hospitality collection.' },
  { year: '2006', title: 'Munyonyo Commonwealth Resort', sortOrder: 3,
    description: 'Completed in a record eleven months, marking the next stage in the Group’s expansion.' },
  { year: 'Expansion', title: 'New Places to Stay and Meet', sortOrder: 4,
    description: 'The collection grows to include lakeside resorts, city hotels, serviced apartments and venues for meetings and celebrations.' },
  { year: 'Today', title: 'A Growing Collection', sortOrder: 5,
    description: 'Speke Group brings together accommodation, dining, leisure and events, welcoming guests travelling for business and pleasure.' },
];

const SPEKE_HOTEL =
  'A historic Kampala landmark on Nile Avenue with fifty en-suite rooms. Its origins date to the 1920s, and it has been part of the Group since 1996.';

async function main() {
  const db = await getDb();
  console.log(`Applying copy to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  let touched = 0;
  const put = async (key: string, value: string, meta?: { label?: string; group?: string; valueType?: string; sortOrder?: number }) => {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, key));
    if (row) {
      await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({
        key, value,
        label: meta?.label ?? key,
        group: meta?.group ?? 'about',
        valueType: meta?.valueType ?? 'text',
        sortOrder: meta?.sortOrder ?? 0,
      });
    }
    touched++;
  };

  for (const a of ABOUT_SETTINGS) {
    await put(a.key, a.value, { label: a.label, group: 'about', valueType: a.valueType, sortOrder: a.sortOrder });
  }
  for (const c of SITE_COPY) await put(c.key, c.value, c);
  console.log(`  settings written: ${touched}`);

  // The milestones show on both the About page and the newsroom.
  await db.delete(milestones);
  await db.insert(milestones).values(MILESTONES);
  console.log(`  milestones replaced: ${MILESTONES.length}`);

  const res = await db.update(properties)
    .set({ description: SPEKE_HOTEL, updatedAt: new Date() })
    .where(eq(properties.slug, 'speke-hotel'))
    .returning({ id: properties.id });
  console.log(`  Speke Hotel description updated: ${res.length}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
