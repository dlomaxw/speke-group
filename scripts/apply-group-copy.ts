/**
 * The "Our Group" heading and paragraph on the homepage. These were template
 * defaults in the page itself, so the dashboard could not reach them; this
 * puts them in the database where the rest of the copy lives.
 *
 *   npx tsx scripts/apply-group-copy.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-group-copy.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { settings } from '../src/db/schema';

const COPY = [
  { key: 'group_title', value: 'Thirteen Places to Stay, Meet and Celebrate',
    label: 'Our Group heading', valueType: 'text', sortOrder: 15 },
  { key: 'group_body', value: 'Discover Speke Group’s collection of hotels, apartments and resorts — where warm Ugandan hospitality meets comfort and style. Whether you’re planning a relaxing escape, a business stay, a new place to call home or a memorable celebration, find your perfect destination with us.',
    label: 'Our Group paragraph', valueType: 'textarea', sortOrder: 16 },
];

async function main() {
  const db = await getDb();
  console.log(`Applying Our Group copy to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);
  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) {
      await db.update(settings).set({ value: c.value, updatedAt: new Date() }).where(eq(settings.key, c.key));
      console.log(`  updated ${c.key}`);
    } else {
      await db.insert(settings).values({ ...c, group: 'homepage' });
      console.log(`  inserted ${c.key}`);
    }
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
