/**
 * Fills empty property links on venues, restaurants, offers and news from the
 * evidence in the content. Safe to re-run; never overwrites a link staff set.
 *
 *   npx tsx scripts/link-properties.ts
 */
import { getDb } from '../src/db';
import { linkContentToProperties } from '../src/lib/property-links';

getDb()
  .then((db) => linkContentToProperties(db))
  .then((n) => { console.log(`Linked ${n} records to their property.`); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
