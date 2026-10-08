/**
 * Makes sure every property has a hero panel waiting in the dashboard, as a
 * draft. They stay off the site until someone publishes one — which is what
 * we will do as each property's film becomes available.
 *
 * Each panel carries no wording of its own, so it takes the property's name,
 * description and booking link until something is written here instead.
 *
 *   npx tsx scripts/apply-hero-property-panels.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-hero-property-panels.ts
 */
import { asc, eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { heroSlides, properties, settings } from '../src/db/schema';

async function main() {
  const db = await getDb();
  console.log(`Checking hero panels on ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  const [cta2] = await db.select({ value: settings.value }).from(settings)
    .where(eq(settings.key, 'home_hero_cta_2'));
  const rows = await db.select({ id: properties.id, slug: properties.slug })
    .from(properties).orderBy(asc(properties.sortOrder));

  let made = 0, had = 0;
  for (const [i, p] of rows.entries()) {
    const slug = `property-${p.slug}`;
    const [existing] = await db.select({ id: heroSlides.id }).from(heroSlides)
      .where(eq(heroSlides.slug, slug));
    if (existing) { had++; continue; }
    await db.insert(heroSlides).values({
      slug,
      propertyId: p.id,
      cta2Label: cta2?.value || 'VIEW OUR COLLECTION',
      cta2Url: '#portfolio',
      sortOrder: i + 2,
      status: 'draft',
    });
    made++;
  }
  console.log(`  created ${made} drafts, ${had} already there.`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
