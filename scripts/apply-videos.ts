/**
 * The convention centre films, as supplied by Speke Group in September 2026.
 * Titles are taken from the captions in the films themselves.
 *
 *   npx tsx scripts/apply-videos.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-videos.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { videos, properties, settings } from '../src/db/schema';

const FILMS = [
  {
    slug: 'where-the-world-meets', title: 'Where the World Meets',
    property: 'speke-resort-convention-centre',
    description: 'Conferences, exhibitions and global meetings at Speke Resort Convention Centre, Kampala.',
    videoUrl: '/assets/film-where-the-world-meets.mp4',
    posterUrl: '/assets/film-where-the-world-meets-poster.webp',
    durationLabel: '0:24', sortOrder: 1,
  },
  {
    slug: 'discover-uganda', title: 'Discover Uganda, the Pearl of Africa',
    property: 'speke-resort-convention-centre',
    description: 'Connect, collaborate and experience: what it is like to bring a world-class event to Uganda.',
    videoUrl: '/assets/film-discover-uganda.mp4',
    posterUrl: '/assets/film-discover-uganda-poster.webp',
    durationLabel: '0:49', sortOrder: 2,
  },
  {
    slug: 'bringing-people-together', title: 'Bringing People Together',
    property: 'speke-resort-convention-centre',
    description: 'A short tour of the halls, grounds and meeting spaces at Munyonyo.',
    videoUrl: '/assets/film-bringing-people-together.mp4',
    posterUrl: '/assets/film-bringing-people-together-poster.webp',
    durationLabel: '0:31', sortOrder: 3,
  },
];

const COPY = [
  { key: 'films_title', value: 'See the Venue for Yourself', label: 'Films heading', valueType: 'text', sortOrder: 30 },
  { key: 'films_body', value: 'Three short films from Speke Resort Convention Centre, where Uganda hosts the world.', label: 'Films paragraph', valueType: 'textarea', sortOrder: 31 },
];

async function main() {
  const db = await getDb();
  console.log(`Applying films to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
    else await db.insert(settings).values({ ...c, group: 'events' });
  }

  for (const f of FILMS) {
    const { property, ...rest } = f;
    const [p] = await db.select({ id: properties.id }).from(properties).where(eq(properties.slug, property));
    const [existing] = await db.select({ id: videos.id }).from(videos).where(eq(videos.slug, f.slug));
    if (existing) {
      await db.update(videos).set({ ...rest, propertyId: p?.id ?? null, updatedAt: new Date() }).where(eq(videos.id, existing.id));
      console.log(`  updated ${f.slug}`);
    } else {
      await db.insert(videos).values({ ...rest, propertyId: p?.id ?? null });
      console.log(`  inserted ${f.slug}`);
    }
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
