import { getDb } from '../src/db';
import { enquiries } from '../src/db/schema';

(async () => {
  const db = await getDb();
  await db.insert(enquiries).values({
    name: 'Aisha Nakato',
    email: 'aisha.nakato@example.com',
    phone: '+256 700 000 000',
    subject: 'Wedding reception for 220 guests in March',
    message: 'We are looking at the Commonwealth Banquet Hall for a Saturday in March, with accommodation for about 40 guests staying over. Could you send rates and confirm availability?',
    kind: 'event',
    sourcePage: '/contact',
  });
  console.log('test enquiry inserted');
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
