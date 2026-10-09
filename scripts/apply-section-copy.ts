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

const COPY: { key: string; value: string; label: string; group: string; valueType: string; sortOrder: number; helpText?: string }[] = [
  /* The two films headings were only ever fallbacks in the page. */
  { key: "home_films_title", value: "See Us for Yourself",
    label: "Films heading", group: "page_home", valueType: "text", sortOrder: 70 },
  { key: "home_films_body", value: "A few short films from across the collection.",
    label: "Films paragraph", group: "page_home", valueType: "textarea", sortOrder: 71 },

  /* The top-level menu and the footer columns. */
  { key: "nav_about", value: "Our Group",
    label: "Menu: Our Group", group: "navigation", valueType: "text", sortOrder: 1 },
  { key: "nav_book", value: "Find & Book",
    label: "Menu: Find & Book", group: "navigation", valueType: "text", sortOrder: 2 },
  { key: "nav_events", value: "Events & Meetings",
    label: "Menu: Events & Meetings", group: "navigation", valueType: "text", sortOrder: 3 },
  { key: "nav_experiences", value: "Experiences",
    label: "Menu: Experiences", group: "navigation", valueType: "text", sortOrder: 4 },
  { key: "nav_news", value: "News",
    label: "Menu: News", group: "navigation", valueType: "text", sortOrder: 5 },
  { key: "nav_contact", value: "Contact",
    label: "Menu: Contact", group: "navigation", valueType: "text", sortOrder: 6 },
  { key: "footer_col_address", value: "Address",
    label: "Footer column: address", group: "navigation", valueType: "text", sortOrder: 7 },
  { key: "footer_col_contact", value: "Contact",
    label: "Footer column: contact", group: "navigation", valueType: "text", sortOrder: 8 },
  { key: "footer_col_information", value: "Information",
    label: "Footer column: information", group: "navigation", valueType: "text", sortOrder: 9 },
  { key: "footer_col_socials", value: "Socials",
    label: "Footer column: socials", group: "navigation", valueType: "text", sortOrder: 10 },
  { key: "footer_map_link", value: "Find us on the map",
    label: "Footer link to the map", group: "navigation", valueType: "text", sortOrder: 11 },
  { key: "footer_information_links",
    value: [
      'About Us | /about',
      'Our Impact | /impact',
      'Questions & Answers | /faq',
      'Events & Meetings | /events',
      'Experiences | /experiences',
      'Careers | https://spekegroup.com/contact/',
      'Terms & Conditions | https://spekegroup.com/contact/',
    ].join(String.fromCharCode(10)),
    label: "Footer information links", group: "navigation", valueType: "textarea", sortOrder: 12,
    helpText: "One link per line, written as Label | /where-it-goes." },
  { key: "home_leisure_eyebrow", value: "Leisure",
    label: "Leisure eyebrow", group: "page_home", valueType: "text", sortOrder: 60 },
  { key: "home_leisure_title", value: "Things to Do Between Meetings",
    label: "Leisure heading", group: "page_home", valueType: "text", sortOrder: 61 },
  { key: "home_leisure_body", value: "A marina on Lake Victoria, horses and ponies in the paddock, and a lakeside that fills with music on a Sunday.",
    label: "Leisure paragraph", group: "page_home", valueType: "textarea", sortOrder: 62 },
  { key: "home_leisure_slugs", value: "marina-experience · equestrian",
    label: "Leisure cards shown", group: "page_home", valueType: "text", sortOrder: 63 },
  { key: "events_weddings_eyebrow", value: "Celebrate",
    label: "Wedding venues eyebrow", group: "page_events", valueType: "text", sortOrder: 64 },
  { key: "events_weddings_title", value: "Wedding Venues",
    label: "Wedding venues heading", group: "page_events", valueType: "text", sortOrder: 65 },
  { key: "events_weddings_body", value: "From lakeside lawns and gardens under the palms to a ballroom for over a thousand guests — each venue can be set for the day you have in mind.",
    label: "Wedding venues paragraph", group: "page_events", valueType: "textarea", sortOrder: 66 },
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
