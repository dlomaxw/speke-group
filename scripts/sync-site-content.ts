/**
 * Brings an existing database in line with the original site design without
 * touching anything staff have edited:
 *   - fills empty image fields with the original photographs
 *   - adds the offers the first seed left out
 *   - adds the page-photo settings, or fills them if blank
 * Safe to run more than once. Stop the dev server first when using the
 * local PGlite database.
 *
 *   npx tsx scripts/sync-site-content.ts
 */
import { and, eq, isNull, or } from 'drizzle-orm';
import { getDb } from '../src/db';
import { properties, venues, restaurants, experiences, newsPosts, offers, settings } from '../src/db/schema';
import {
  PROPERTY_IMAGES, VENUE_IMAGES, DINING_IMAGES, EXPERIENCE_IMAGES, NEWS_IMAGES,
  PAGE_IMAGE_SETTINGS, EXTRA_OFFERS, OFFER_ORDER,
} from '../src/lib/default-images';

async function main() {
  const db = await getDb();
  let filled = 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fill = async (table: any, map: Record<string, string>) => {
    for (const [slug, url] of Object.entries(map)) {
      const res = await db.update(table)
        .set({ imageUrl: url })
        .where(and(eq(table.slug, slug), or(isNull(table.imageUrl), eq(table.imageUrl, ''))))
        .returning({ id: table.id });
      filled += res.length;
    }
  };

  await fill(properties, PROPERTY_IMAGES);
  await fill(venues, VENUE_IMAGES);
  await fill(restaurants, DINING_IMAGES);
  await fill(experiences, EXPERIENCE_IMAGES);
  await fill(newsPosts, NEWS_IMAGES);
  console.log(`  images filled: ${filled}`);

  const existing = await db.select({ name: offers.name, category: offers.category }).from(offers);
  const have = new Set(existing.map((o) => `${o.category}|${o.name}`));
  const missing = EXTRA_OFFERS.filter((o) => !have.has(`${o.category}|${o.name}`));
  if (missing.length) await db.insert(offers).values(missing.map((o) => ({ ...o, status: 'published' as const })));
  console.log(`  offers added: ${missing.length}`);

  for (const [name, order] of Object.entries(OFFER_ORDER)) {
    await db.update(offers).set({ sortOrder: order }).where(eq(offers.name, name));
  }

  let settingsTouched = 0;
  for (const s of PAGE_IMAGE_SETTINGS) {
    const [row] = await db.select().from(settings).where(eq(settings.key, s.key));
    if (!row) {
      await db.insert(settings).values({
        key: s.key, label: s.label, value: s.value, group: s.group,
        valueType: 'image', sortOrder: s.sortOrder,
      });
      settingsTouched++;
    } else if (!row.value) {
      await db.update(settings).set({ value: s.value }).where(eq(settings.key, s.key));
      settingsTouched++;
    }
  }
  console.log(`  page photo settings added or filled: ${settingsTouched}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
