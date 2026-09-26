/**
 * Points the homepage hero at the property film: a landscape cut for desktops
 * and a vertical cut for phones, each with its own poster.
 *
 *   npx tsx scripts/apply-hero-video.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-hero-video.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { settings } from '../src/db/schema';

const HERO = [
  { key: 'hero_video_url', value: '/assets/hero-properties.mp4',
    label: 'Hero video', valueType: 'video', sortOrder: 1,
    helpText: 'The looping film behind the homepage headline, shown on tablets and desktops. MP4, 16:9.' },
  { key: 'hero_poster_url', value: '/assets/hero-properties-poster.webp',
    label: 'Hero poster image', valueType: 'image', sortOrder: 2,
    helpText: 'Shown while the video loads.' },
  { key: 'hero_video_mobile_url', value: '/assets/hero-properties-mobile.mp4',
    label: 'Hero video (phones)', valueType: 'video', sortOrder: 3,
    helpText: 'The vertical cut, used on screens under 768px. Leave empty to use the landscape film everywhere.' },
  { key: 'hero_poster_mobile_url', value: '/assets/hero-properties-mobile-poster.webp',
    label: 'Hero poster image (phones)', valueType: 'image', sortOrder: 4,
    helpText: 'Shown while the vertical video loads.' },
];

async function main() {
  const db = await getDb();
  console.log(`Applying hero video settings to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const h of HERO) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, h.key));
    if (row) {
      await db.update(settings)
        .set({ value: h.value, helpText: h.helpText, updatedAt: new Date() })
        .where(eq(settings.key, h.key));
      console.log(`  updated ${h.key}`);
    } else {
      await db.insert(settings).values({ ...h, group: 'homepage' });
      console.log(`  inserted ${h.key}`);
    }
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
