/**
 * Section headings, eyebrows and button labels that used to be written into
 * the page templates. They are settings now, so the dashboard can change any
 * wording on the site without a deploy.
 *
 *   npx tsx scripts/apply-section-copy.ts                       (local)
 *   DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/apply-section-copy.ts
 */
import { eq } from 'drizzle-orm';
import { getDb, usingD1 } from '../src/db';
import { settings } from '../src/db/schema';

const COPY: { key: string; value: string; label: string; group: string; valueType: string; sortOrder: number }[] = [
  { key: "home_story_eyebrow", value: "Our Story",
    label: "Our Story eyebrow", group: "page_home", valueType: "text", sortOrder: 1 },
  { key: "home_portfolio_eyebrow", value: "Find & Book",
    label: "Collection eyebrow", group: "page_home", valueType: "text", sortOrder: 2 },
  { key: "home_portfolio_title", value: "Our Collection",
    label: "Collection heading", group: "page_home", valueType: "text", sortOrder: 3 },
  { key: "home_awards_eyebrow", value: "Recognition",
    label: "Awards eyebrow", group: "page_home", valueType: "text", sortOrder: 4 },
  { key: "home_wellness_eyebrow", value: "Experience",
    label: "Wellness eyebrow", group: "page_home", valueType: "text", sortOrder: 5 },
  { key: "home_impact_eyebrow", value: "Sustainability",
    label: "Sustainability eyebrow", group: "page_home", valueType: "text", sortOrder: 6 },
  { key: "home_offers_eyebrow", value: "Our Specials",
    label: "Offers eyebrow", group: "page_home", valueType: "text", sortOrder: 7 },
  { key: "home_offers_title", value: "Enjoy Packages & Offers",
    label: "Offers heading", group: "page_home", valueType: "text", sortOrder: 8 },
  { key: "home_hero_cta_1", value: "DISCOVER SPEKE GROUP",
    label: "Hero button 1", group: "page_home", valueType: "text", sortOrder: 9 },
  { key: "home_hero_cta_2", value: "VIEW OUR COLLECTION",
    label: "Hero button 2", group: "page_home", valueType: "text", sortOrder: 10 },
  { key: "home_impact_cta", value: "SEE WHAT WE DO",
    label: "Sustainability button", group: "page_home", valueType: "text", sortOrder: 11 },
  { key: "about_story_eyebrow", value: "Our Story",
    label: "Our Story eyebrow", group: "page_about", valueType: "text", sortOrder: 12 },
  { key: "about_history_eyebrow", value: "Our History",
    label: "Our History eyebrow", group: "page_about", valueType: "text", sortOrder: 13 },
  { key: "about_journey_eyebrow", value: "Our Journey",
    label: "Milestones eyebrow", group: "page_about", valueType: "text", sortOrder: 14 },
  { key: "about_journey_title", value: "Milestones in the Speke Story",
    label: "Milestones heading", group: "page_about", valueType: "text", sortOrder: 15 },
  { key: "about_today_eyebrow", value: "Speke Group Today",
    label: "Closing eyebrow", group: "page_about", valueType: "text", sortOrder: 16 },
  { key: "events_venues_eyebrow", value: "Explore",
    label: "Venues eyebrow", group: "page_events", valueType: "text", sortOrder: 17 },
  { key: "events_venues_title", value: "Meeting Venues",
    label: "Venues heading", group: "page_events", valueType: "text", sortOrder: 18 },
  { key: "events_occasions_eyebrow", value: "What We Host",
    label: "Occasions eyebrow", group: "page_events", valueType: "text", sortOrder: 19 },
  { key: "events_occasions_title", value: "Occasions We Host",
    label: "Occasions heading", group: "page_events", valueType: "text", sortOrder: 20 },
  { key: "news_eyebrow", value: "Newsroom",
    label: "Newsroom eyebrow", group: "page_news", valueType: "text", sortOrder: 21 },
  { key: "news_latest_title", value: "Latest Stories",
    label: "Latest stories heading", group: "page_news", valueType: "text", sortOrder: 22 },
  { key: "faq_eyebrow", value: "Help",
    label: "FAQ eyebrow", group: "page_faq", valueType: "text", sortOrder: 23 },
  { key: "faq_closing_title", value: "Still have a question?",
    label: "Closing heading", group: "page_faq", valueType: "text", sortOrder: 24 },
  { key: "impact_list_eyebrow", value: "At Each Property",
    label: "Initiatives eyebrow", group: "page_impact", valueType: "text", sortOrder: 25 },
  { key: "impact_list_title", value: "What Is Running Today",
    label: "Initiatives heading", group: "page_impact", valueType: "text", sortOrder: 26 },
  { key: "impact_next_eyebrow", value: "Next",
    label: "Next steps eyebrow", group: "page_impact", valueType: "text", sortOrder: 27 },
  { key: "contact_form_title", value: "Send a Message",
    label: "Enquiry form heading", group: "page_contact", valueType: "text", sortOrder: 28 },
  { key: "contact_directory_title", value: "Our Thirteen Properties",
    label: "Directory heading", group: "page_contact", valueType: "text", sortOrder: 29 },
];

async function main() {
  const db = await getDb();
  console.log(`Applying section copy to ${usingD1() ? 'Cloudflare D1' : 'local SQLite'}…`);
  let inserted = 0, kept = 0;
  for (const c of COPY) {
    const [row] = await db.select({ key: settings.key }).from(settings).where(eq(settings.key, c.key));
    if (row) { kept++; continue; }          /* never overwrite wording already edited */
    await db.insert(settings).values(c);
    inserted++;
  }
  console.log(`  inserted ${inserted}, left alone ${kept}`);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
