import { eq } from 'drizzle-orm';
import { getDb } from '../src/db';
import { properties, activityLog } from '../src/db/schema';

(async () => {
  const db = await getDb();
  // undo the edit made while testing the form
  await db.update(properties)
    .set({ area: 'Nile Avenue, Kampala' })
    .where(eq(properties.id, 1));

  const [p] = await db.select().from(properties).where(eq(properties.id, 1));
  console.log('property 1 area  :', p.area);

  const log = await db.select().from(activityLog);
  console.log('activity entries :', log.length);
  log.slice(-3).forEach(a =>
    console.log(`   ${a.userEmail} ${a.action} ${a.entity} ${a.summary ?? ''}`));
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
