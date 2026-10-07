/**
 * Fills the hero panel list with what the hero already shows: the Group's
 * line, then one panel per property. The property panels carry no wording of
 * their own, so each takes its name, description and booking link from the
 * property record until someone writes something here instead.
 *
 *   npx tsx scripts/apply-hero-slides.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-hero-slides.ts
 */
import { asc, eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { heroSlides, properties, settings } from '../src/db/schema';

async function main() {
  const db = await getDb();
  console.log(`Filling hero panels on ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const existing = await db.select({ id: heroSlides.id }).from(heroSlides);
  if (existing.length) {
    console.log(`  ${existing.length} panels already set up — leaving them alone.`);
    return;
  }

  const get = async (key: string, fallback: string) => {
    const [row] = await db.select({ value: settings.value }).from(settings).where(eq(settings.key, key));
    return row?.value || fallback;
  };

  await db.insert(heroSlides).values({
    slug: 'the-group',
    eyebrow: await get('hero_eyebrow', 'Speke Group of Hotels'),
    title: await get('hero_title', 'Distinctive Places Across Uganda'),
    titleAccent: await get('hero_title_accent', 'One Warm Welcome'),
    body: await get('hero_body', ''),
    ctaLabel: await get('home_hero_cta_1', 'DISCOVER SPEKE GROUP'),
    ctaUrl: '#our-group',
    cta2Label: await get('home_hero_cta_2', 'VIEW OUR COLLECTION'),
    cta2Url: '#portfolio',
    sortOrder: 1,
  });

  const rows = await db.select({ id: properties.id, slug: properties.slug })
    .from(properties).orderBy(asc(properties.sortOrder));
  const cta2 = await get('home_hero_cta_2', 'VIEW OUR COLLECTION');
  for (const [i, p] of rows.entries()) {
    await db.insert(heroSlides).values({
      slug: `property-${p.slug}`,
      propertyId: p.id,
      cta2Label: cta2,
      cta2Url: '#portfolio',
      sortOrder: i + 2,
    });
  }
  console.log(`  created ${rows.length + 1} panels.`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
