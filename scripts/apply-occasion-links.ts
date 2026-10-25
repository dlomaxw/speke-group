/**
 * Gives the "Occasions we host" tiles somewhere to go.
 *
 * They were plain tiles with a cursor that promised nothing, which read as
 * broken next to cards that do open. Weddings and Meetings now lead to the
 * pages built for them; catering leads to the Convention Centre's own catering
 * page, since we publish nothing of our own on it.
 *
 * The field already existed on the block and is editable in the dashboard —
 * this only fills it in.
 *
 *   npx tsx scripts/apply-occasion-links.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-occasion-links.ts
 */
import { and, eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { highlightBlocks } from '../src/db/schema';

const LINKS: Record<string, string> = {
  'Weddings': '/weddings',
  'Meetings': '/conferences',
  'World-Class Catering': 'https://srcc-ug.com/premium-event-catering/',
};

async function main() {
  const db = await getDb();
  console.log(`Linking occasion tiles on ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);

  for (const [name, linkUrl] of Object.entries(LINKS)) {
    const res = await db.update(highlightBlocks)
      .set({ linkUrl, updatedAt: new Date() })
      .where(and(eq(highlightBlocks.section, 'occasions'), eq(highlightBlocks.name, name)))
      .returning({ id: highlightBlocks.id });
    if (!res.length) console.warn(`  ! no occasion block named "${name}"`);
    else console.log(`  ${name} -> ${linkUrl}`);
  }
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
