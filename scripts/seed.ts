/**
 * Seeds the database with the content currently on the live site plus the
 * starter staff accounts. Safe to re-run: it clears the content tables first
 * but leaves any users that already exist alone.
 *
 *   npm run db:seed
 */
import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { getDb } from '../src/db';
import {
  users, properties, venues, venueGroups, restaurants, experiences,
  newsPosts, offers, milestones, highlightBlocks, settings,
} from '../src/db/schema';
import {
  PROPERTY_IMAGES, VENUE_IMAGES, DINING_IMAGES, EXPERIENCE_IMAGES, NEWS_IMAGES,
  PAGE_IMAGE_SETTINGS, EXTRA_OFFERS, OFFER_ORDER,
} from '../src/lib/default-images';
import { linkContentToProperties } from '../src/lib/property-links';
import { ABOUT_SETTINGS } from '../src/lib/about-content';

/** Attach the original photograph to each seeded record. */
const withImages = <const T extends { slug: string }>(rows: T[], map: Record<string, string>) =>
  rows.map((r) => ({ ...r, imageUrl: map[r.slug] ?? null }));

const CONTACT = {
  address1: '4th Floor, Crane Chambers,',
  address2: 'Kampala Road, Uganda',
  phone1: '(+256) 707 711 750',
  phone2: '(+256) 702 711 142',
  phone3: '(+256) 752 711 016',
  email: 'info@spekegroup.com',
  diningEmail: 'fb@spekeresort.com',
  facebook: 'https://web.facebook.com/spekegroup',
  twitter: 'https://twitter.com/speke_group',
};

/** D1 caps a statement at 100 bound values, so bulk inserts go in small batches. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertAll(table: any, rows: Record<string, unknown>[]) {
  const db = await getDb();
  const columns = Math.max(1, ...rows.map((r) => Object.keys(r).length + 2));
  const size = Math.max(1, Math.floor(90 / columns));
  for (let i = 0; i < rows.length; i += size) {
    await db.insert(table).values(rows.slice(i, i + size));
  }
}

async function main() {
  const db = await getDb();
  console.log('Seeding…');

  /* ---------- staff accounts ---------- */
  const starterUsers = [
    { email: 'it@spekegroup.com',        name: 'IT Administrator', role: 'admin' as const,     department: 'IT' },
    { email: 'gm@spekegroup.com',        name: 'General Manager',  role: 'manager' as const,   department: 'Management' },
    { email: 'marketing@spekegroup.com', name: 'Marketing Team',   role: 'marketing' as const, department: 'Marketing' },
    { email: 'viewer@spekegroup.com',    name: 'Read Only',        role: 'viewer' as const,    department: 'General' },
  ];
  const initialPassword = process.env.SEED_PASSWORD || 'Speke2026@';
  const passwordHash = await bcrypt.hash(initialPassword, 12);

  for (const u of starterUsers) {
    await db.insert(users).values({ ...u, passwordHash, mustChangePassword: true })
      .onConflictDoNothing({ target: users.email });
  }
  console.log(`  users ready (initial password: ${initialPassword})`);

  /* ---------- wipe content so re-runs are clean ---------- */
  for (const t of [properties, venues, venueGroups, restaurants, experiences,
                   newsPosts, offers, milestones, highlightBlocks, settings]) {
    await db.delete(t);
  }

  /* ---------- properties ---------- */
  await insertAll(properties, withImages([
    { slug: 'speke-hotel', name: 'Speke Hotel', kind: 'hotel', categoryLabel: 'Hotel', area: 'Nile Avenue, Kampala',
      websiteUrl: 'https://www.spekehotel.com/', sortOrder: 1,
      description: 'A historic Kampala landmark on Nile Avenue with fifty en-suite rooms. Its origins date to the 1920s, and it has been part of the Group since 1996.' },
    { slug: 'kabira-country-club', name: 'Kabira Country Club', kind: 'hotel', categoryLabel: 'Hotel', area: 'Bukoto, Kampala',
      websiteUrl: 'https://kabiracountryclub.com/', sortOrder: 2,
      description: 'A world-class abode for guests and travellers, added to the Group shortly after Munyonyo.' },
    { slug: 'forest-cottages-hotel', name: 'Forest Cottages Hotel', kind: 'hotel', categoryLabel: 'Hotel', area: 'Bukoto, Kampala',
      websiteUrl: 'https://forest-cottages.com/', sortOrder: 3,
      description: 'A 27-room eco-friendly boutique hotel in Bukoto, built in harmony with its surroundings, with monkeys and over twenty bird species in the grounds.' },
    { slug: 'dolphin-suites-hotel', name: 'Dolphin Suites Hotel', kind: 'hotel', categoryLabel: 'Hotel', area: 'Bugolobi, Kampala',
      websiteUrl: 'https://dolphinsuites.co.ug/', sortOrder: 4,
      description: 'A boutique hotel of 27 rooms with private balconies over the Bugolobi hillside and the city. Part of the Group since May 2010.' },
    { slug: 'speke-resort-munyonyo', name: 'Speke Resort Munyonyo', kind: 'resort', categoryLabel: 'Resort', area: 'Munyonyo, Lake Victoria',
      websiteUrl: 'https://www.spekeresort.com/', sortOrder: 5,
      description: 'Home to the largest privately owned marina in Uganda, on the shores of Lake Victoria.' },
    { slug: 'munyonyo-commonwealth-resort', name: 'Munyonyo Commonwealth Resort', kind: 'resort', categoryLabel: 'Resort', area: 'Munyonyo, Lake Victoria',
      websiteUrl: 'https://munyonyocommonwealth.com/', sortOrder: 6,
      description: 'Completed in a record eleven months in 2006, marking the Group’s next stage of expansion.' },
    { slug: 'speke-resort-convention-centre', name: 'Speke Resort Convention Centre', kind: 'convention', categoryLabel: 'Convention Centre', area: 'Munyonyo, Lake Victoria',
      websiteUrl: 'https://www.spekeresort.com/indoor-meetings/', sortOrder: 7,
      description: 'Ballrooms plus indoor and outdoor conference venues, hosting national and international conventions.' },
    { slug: 'speke-apartments-wampewo', name: 'Speke Apartments Wampewo', kind: 'apartment', categoryLabel: 'Apartment', area: 'Wampewo Avenue, Kololo',
      websiteUrl: 'https://www.spekeapartments.com/wampewo/', sortOrder: 8,
      description: 'Luxury apartments in Kololo overlooking the city, five minutes from the central business district, with pools, a fitness centre and a spa.' },
    { slug: 'speke-apartments-kitante', name: 'Speke Apartments Kitante', kind: 'apartment', categoryLabel: 'Apartment', area: 'Kitante Close, Kampala',
      websiteUrl: 'https://www.spekeapartments.com/kitante/', sortOrder: 9,
      description: 'Eighty-three fully furnished one and two bedroom serviced apartments on Kitante Close, with high-end appliances throughout.' },
    { slug: 'boulevard-suites', name: 'Boulevard Suites', kind: 'apartment', categoryLabel: 'Apartment', area: 'Kampala Road',
      websiteUrl: 'https://www.boulevardsuites.co.ug/', sortOrder: 10,
      description: 'One, two and three bedroom apartments on the upper floors of Boulevard building, across the road from the Bank of Uganda.' },
    { slug: 'bukoto-heights', name: 'Bukoto Heights', kind: 'apartment', categoryLabel: 'Apartment', area: 'Moyo Close, Bukoto',
      websiteUrl: 'https://bukotoheights.com/', sortOrder: 11,
      description: 'A luxury serviced apartment block in Bukoto for long and short stays, with its own leisure facilities and the Heights Bar & Cafe.' },
    { slug: 'tagore-apartments', name: 'Tagore Apartments', kind: 'apartment', categoryLabel: 'Apartment', area: 'Mawanda Road, Kamwokya',
      websiteUrl: 'https://www.tagoreapartments.com/', sortOrder: 12,
      description: 'Fourteen spacious serviced units on Mawanda Road opposite Acacia Mall, each with a balcony, kitchen and two bathrooms.' },
    { slug: 'naguru-apartments', name: 'Naguru Apartments', kind: 'apartment', categoryLabel: 'Apartment', area: 'Naguru, Kampala',
      websiteUrl: 'https://spekegroup.com/naguru-apartments/', sortOrder: 13,
      description: 'Eighteen furnished two and three bedroom apartments in quiet Naguru, with complimentary access to Kabira Country Club five minutes away.' },
  ], PROPERTY_IMAGES));

  /* ---------- meeting venues ---------- */
  await insertAll(venues, withImages([
    { slug: 'kabira-ballroom', name: 'Kabira Ballroom', location: 'Kabira Country Club', capacity: '400 guests', venueSize: 'Ballroom', sizeTag: 's120', sortOrder: 1 },
    { slug: 'palm', name: 'Palm', location: 'Kabira Country Club', capacity: '120 guests', venueSize: 'Conference', sizeTag: 's120', sortOrder: 2 },
    { slug: 'pine', name: 'Pine', location: 'Kabira Country Club', capacity: '80 guests', venueSize: 'Conference', sizeTag: 's50', sortOrder: 3 },
    { slug: 'acacia', name: 'Acacia', location: 'Kabira Country Club', capacity: '50 guests', venueSize: 'Conference', sizeTag: 's50', sortOrder: 4 },
    { slug: 'oak', name: 'Oak', location: 'Kabira Country Club', capacity: '35 guests', venueSize: 'Boardroom', sizeTag: 's10', sortOrder: 5 },
    { slug: 'jacaranda', name: 'Jacaranda', location: 'Kabira Country Club', capacity: '35 guests', venueSize: 'Boardroom', sizeTag: 's10', sortOrder: 6 },
    { slug: 'sapphire', name: 'Sapphire', location: 'Speke Resort', capacity: '15 to 35 guests', venueSize: '62 sq m', sizeTag: 's10', sortOrder: 7 },
    { slug: 'amethyst', name: 'Amethyst', location: 'Speke Resort', capacity: '10 to 25 guests', venueSize: '58 sq m', sizeTag: 's10', sortOrder: 8 },
    { slug: 'sanga', name: 'Sanga', location: 'Speke Resort', capacity: '10 to 24 guests', venueSize: '34 sq m', sizeTag: 's10', sortOrder: 9 },
    { slug: 'victoria-ballroom', name: 'Victoria Ballroom', location: 'Speke Resort Convention Centre', capacity: '1000 to 1400 guests', venueSize: 'Grand ballroom', sizeTag: 's1000', sortOrder: 10 },
    { slug: 'speke-ballroom', name: 'Speke Ballroom', location: 'Speke Resort Convention Centre', capacity: '1000 to 1400 guests', venueSize: 'Grand ballroom', sizeTag: 's1000', sortOrder: 11 },
    { slug: 'commonwealth-banquet-hall', name: 'Commonwealth Banquet Hall', location: 'Munyonyo Commonwealth Resort', capacity: '120 to 400 guests', venueSize: 'Banquet hall', sizeTag: 's120', sortOrder: 12 },
  ], VENUE_IMAGES));

  await insertAll(venueGroups, [
    { groupName: 'Speke Resort Convention Centre', sortOrder: 1,
      venueList: 'Victoria Ballroom · Speke Ballroom · Royal Hall · Royal Palm Hall · Majestic Hall · Mahogany Hall · Ebony Hall · Meera Hall · Sheena Hall · Kalangala Hall · Albert Hall' },
    { groupName: 'Speke Resort Munyonyo', sortOrder: 2,
      venueList: 'Sanga · Amethyst · Sapphire · Speke Poolside · Flagmast Garden · Mango Garden · Lakeside Garden · Marina Restaurant · Royal Club' },
    { groupName: 'Munyonyo Commonwealth Resort', sortOrder: 3,
      venueList: 'Commonwealth Banquet Hall · Commonwealth Poolside · Peace Hub · Lower Peace Hub' },
    { groupName: 'Kabira Country Club', sortOrder: 4,
      venueList: 'Kabira Ballroom · Palm · Pine · Acacia · Oak · Jacaranda · Kabira Poolside · Kabira Sports Grounds' },
  ]);

  /* ---------- restaurants and bars ---------- */
  await insertAll(restaurants, withImages([
    { slug: 'nyanja', name: 'Nyanja', kind: 'restaurant', cuisine: 'Multi Cuisine', sortOrder: 1,
      description: "The Group's multi-cuisine restaurant, serving Continental and Asian specialities with a modern twist." },
    { slug: 'the-stables', name: 'The Stables', kind: 'restaurant', cuisine: 'Grill', sortOrder: 2,
      description: 'A relaxed dining room beside the equestrian grounds at Speke Resort Munyonyo.' },
    { slug: 'lake-grill', name: 'Lake Grill', kind: 'restaurant', cuisine: 'Lakeside Grill', sortOrder: 3,
      description: 'Family-friendly cuisine under the African sky on the shores of Lake Victoria. Whole Tilapia and hog on the spit.',
      openingTimes: 'Sunday and Public Holidays', dressCode: 'Casual', phone: '+256 752 711 865', email: CONTACT.diningEmail },
    { slug: 'pool-side-restaurant', name: 'Pool Side Restaurant', kind: 'restaurant', cuisine: 'Casual Dining', sortOrder: 4,
      description: 'Sit under a grass-thatched roof or lounge by the pool with drinks in hand, dining on whole Tilapia and burgers.' },
    { slug: 'the-pub', name: 'The Pub', kind: 'restaurant', cuisine: 'Continental · African · Indian', sortOrder: 5,
      description: 'Continental, African and Indian cuisine in a classic pub setting.' },
    { slug: 'la-cabana', name: 'La Cabana', kind: 'restaurant', cuisine: 'Brazilian · Chinese · Indian', sortOrder: 6,
      description: 'Brazilian, Chinese and Indian cuisine served across one menu.' },
    { slug: 'khyber-pass', name: 'Khyber Pass', kind: 'restaurant', cuisine: 'Indian', sortOrder: 7,
      description: "Authentic Indian cuisine, one of the Group's longest-standing restaurant names." },
    { slug: 'viking-bar', name: 'Viking Bar', kind: 'bar', sortOrder: 1, description: "A nightlife hotspot within the Group's Kampala collection." },
    { slug: 'rock-bar', name: 'Rock Bar', kind: 'bar', sortOrder: 2, description: 'Cool, refined and menu-focused, for a worthwhile night adventure.' },
    { slug: 'forest-cottages-bar', name: 'Forest Cottages Bar', kind: 'bar', sortOrder: 3, description: 'A quiet garden bar at Forest Cottages Hotel.' },
    { slug: 'heights-bar-cafe', name: 'Heights Bar & Cafe', kind: 'bar', sortOrder: 4, description: 'Cafe by day and bar by night at Bukoto Heights.' },
  ], DINING_IMAGES));

  /* ---------- experiences ---------- */
  await insertAll(experiences, withImages([
    { slug: 'spas-and-salons', name: 'Spas & Salons', sortOrder: 1,
      description: 'Inspired by the riches of nature, we offer massages, facials and steam baths that combine a cocktail of original active ingredients and memorable fragrances.',
      highlights: 'Body massage · Facials · Steam baths' },
    { slug: 'gyms', name: 'Gyms', sortOrder: 2,
      description: 'Build the body of your dreams through proper diet and exercise, with state-of-the-art equipment and a team of dedicated professional trainers.',
      highlights: 'Aerobics · Body building · Personal training' },
    { slug: 'marina-experience', name: 'Marina Experience', sortOrder: 3,
      description: 'Speke Resort Munyonyo and Munyonyo Commonwealth Resort share the largest privately owned marina in Uganda, offering boat cruises, water safaris and fishing excursions.',
      highlights: 'Fishing · Bird watching · Boat trips · Trips to islands' },
    { slug: 'equestrian', name: 'Equestrian', sortOrder: 4,
      description: 'The Pony Camp is for children aged 6 to 17, from beginners to advanced riders, with show-quality ponies, experienced year-round trainers and a small teacher-to-student ratio.',
      highlights: 'Pony camp · Pony rides · Grooming and horsemanship' },
    { slug: 'lakeside', name: 'Lakeside', sortOrder: 5,
      description: 'Themed Sundays on the shores of Lake Victoria at Lake Grill, with fresh whole Tilapia and hog on the spit.',
      highlights: "Live jazz band · Market fair · Children's activities · Acrobats" },
    { slug: 'swimming-pools', name: 'Swimming Pools', sortOrder: 6,
      description: 'Sit at a table under a grass-thatched roof or simply lounge by the pool with drinks in hand while dining on whole Tilapia fish and burgers amongst others.',
      highlights: 'Poolside dining · Olympic-size pool at Speke Resort' },
  ], EXPERIENCE_IMAGES));

  /* ---------- news ---------- */
  const d = (iso: string) => new Date(iso);
  await insertAll(newsPosts, withImages([
    { slug: 'speke-resort-munyonyo-completes-room-renovation', title: 'Speke Resort Munyonyo Completes Room Renovation',
      propertyLabel: 'Speke Resort Munyonyo', tag: 'property', isFeatured: true, status: 'published', publishedAt: d('2026-08-12'),
      excerpt: "All lakeside rooms have been refreshed with new furnishings ahead of the conference season, continuing the Group's programme of investment across its 900-plus modern rooms." },
    { slug: 'speke-group-named-ugandas-leading-hospitality-employer', title: "Speke Group Named Uganda's Leading Hospitality Employer",
      propertyLabel: 'Group', tag: 'group', status: 'published', publishedAt: d('2026-07-08'),
      excerpt: 'Recognised for staff development and training programmes across all thirteen properties.' },
    { slug: 'kabira-country-club-hosts-national-golf-open', title: 'Kabira Country Club Hosts National Golf Open',
      propertyLabel: 'Kabira Country Club', tag: 'events', status: 'published', publishedAt: d('2026-06-15'),
      excerpt: 'The course welcomed players from across East Africa for a weekend of competition.' },
    { slug: 'new-wing-opens-at-speke-resort-convention-centre', title: 'New Wing Opens at Speke Resort Convention Centre',
      propertyLabel: 'Convention Centre', tag: 'property', status: 'published', publishedAt: d('2026-05-20'),
      excerpt: 'Additional breakout rooms expand capacity for mid-sized conferences alongside the Victoria and Speke ballrooms.' },
    { slug: 'dolphin-suites-launches-long-stay-packages', title: 'Dolphin Suites Launches Long-Stay Packages',
      propertyLabel: 'Dolphin Suites', tag: 'property', status: 'published', publishedAt: d('2026-04-02'),
      excerpt: 'Extended-stay rates introduced for corporate and diplomatic guests in Kampala.' },
    { slug: 'speke-group-marks-25-years', title: 'Speke Group Marks 25 Years of Ugandan Hospitality',
      propertyLabel: 'Group', tag: 'group', status: 'published', publishedAt: d('2026-03-11'),
      excerpt: 'A look back at the Group’s journey from the acquisition of Speke Hotel in 1996 to a collection of thirteen properties.' },
    { slug: 'spa-treatment-menu-refreshed', title: 'Spa Treatment Menu Refreshed Across the Group',
      propertyLabel: 'Group', tag: 'group', status: 'published', publishedAt: d('2026-02-05'),
      excerpt: 'New massage, facial and steam treatments drawing on original active ingredients and memorable fragrances.' },
  ], NEWS_IMAGES));

  /* ---------- offers ---------- */
  const baseOffers = [
    { category: 'accommodation', propertyLabel: 'Speke Resort', name: 'Getaway at Speke Resort', description: 'A lakeside escape package at Speke Resort Munyonyo.', sortOrder: 1 },
    { category: 'accommodation', propertyLabel: 'Kabira Country Club', name: 'Your Home, Refined', description: 'Extended-stay comfort at Kabira Country Club.', sortOrder: 2 },
    { category: 'accommodation', propertyLabel: 'Bukoto Heights', name: 'Kumi na Tani — 15 Days', description: 'A fifteen-day residence package at Bukoto Heights.', sortOrder: 3 },
    { category: 'accommodation', propertyLabel: 'Group Wide', name: 'Midweek Getaway', description: 'Reduced midweek rates across selected properties.', sortOrder: 4 },
    { category: 'dining', propertyLabel: 'Speke Resort', name: 'Cocktail Culture', description: 'Classic and signature cocktails at Speke Resort Munyonyo.', sortOrder: 1 },
    { category: 'dining', propertyLabel: 'Speke Resort', name: 'Soulful Sunday Feast', description: 'Sunday dining on the shores of Lake Victoria.', sortOrder: 2 },
    { category: 'dining', propertyLabel: 'Kabira Country Club', name: 'Mongolian Fridays', description: 'Mongolian grill night at Kabira Country Club.', sortOrder: 3 },
    { category: 'dining', propertyLabel: 'Dolphin Suites', name: 'Business Lunch', description: 'A set business lunch at Dolphin Suites Hotel.', sortOrder: 4 },
    { category: 'events', propertyLabel: 'Group Wide', name: 'Weddings & Celebrations', description: 'From intimate affairs created just for two to grand extravaganzas, we have the perfect venue for you.', sortOrder: 1 },
    { category: 'events', propertyLabel: 'Group Wide', name: 'Meetings & Conferences', description: 'Each venue is unique and can be set up to suit your particular needs and requirements.', sortOrder: 2 },
    { category: 'events', propertyLabel: 'Group Wide', name: 'World-Class Catering', description: 'Buffet menus or bespoke requirements, catering birthday parties, corporate events, receptions and christenings.', sortOrder: 3 },
    { category: 'spa', propertyLabel: 'Calabash Spa', name: 'Body Massage', description: 'Deeply relaxing massages that harmonise and balance your energy flow, de-stress the body and stimulate blood flow.', sortOrder: 1 },
    { category: 'spa', propertyLabel: 'Calabash Spa', name: 'Facials', description: 'Inspired by the riches of nature, combining original active ingredients and memorable fragrances.', sortOrder: 2 },
    { category: 'spa', propertyLabel: 'Calabash Spa', name: 'Steam Baths', description: 'Sauna sessions to burn calories, ease pain, boost mood, improve sleep and support immune function.', sortOrder: 3 },
  ];
  await insertAll(offers, 
    [...baseOffers, ...EXTRA_OFFERS].map((o) => ({ ...o, sortOrder: OFFER_ORDER[o.name] ?? o.sortOrder })),
  );

  /* ---------- milestones ---------- */
  await insertAll(milestones, [
    { year: '1920s', title: 'A Kampala Landmark', sortOrder: 1,
      description: 'Speke Hotel opens in central Kampala, beginning a history of welcoming visitors to the city.' },
    { year: '1996', title: 'A New Chapter', sortOrder: 2,
      description: 'Dr. Sudhir Ruparelia acquires Speke Hotel, laying the foundation for the group’s hospitality collection.' },
    { year: '2006', title: 'Munyonyo Commonwealth Resort', sortOrder: 3,
      description: 'Completed in a record eleven months, marking the next stage in the Group’s expansion.' },
    { year: 'Expansion', title: 'New Places to Stay and Meet', sortOrder: 4,
      description: 'The collection grows to include lakeside resorts, city hotels, serviced apartments and venues for meetings and celebrations.' },
    { year: 'Today', title: 'A Growing Collection', sortOrder: 5,
      description: 'Speke Group brings together accommodation, dining, leisure and events, welcoming guests travelling for business and pleasure.' },
  ]);

  /* ---------- pillars and occasions ---------- */
  await insertAll(highlightBlocks, [
    { section: 'pillars', icon: '◇', name: 'Conferences', linkUrl: '/events', sortOrder: 1,
      description: 'Forty-five state-of-the-art conference rooms across the Group, from boardrooms to ballrooms.' },
    { section: 'pillars', icon: '❀', name: 'Spas & Salons', linkUrl: '/experiences', sortOrder: 2,
      description: 'Massages, facials and steam baths that combine original active ingredients with memorable fragrances.' },
    { section: 'pillars', icon: '◆', name: 'Restaurants', linkUrl: '/experiences', sortOrder: 3,
      description: 'Authentic Asian and Continental specialities with a modern twist, plus classic cocktails.' },
    { section: 'pillars', icon: '✱', name: 'Fitness Centres', linkUrl: '/experiences', sortOrder: 4,
      description: 'Aerobics, body building and personal training with state-of-the-art equipment and dedicated trainers.' },
    { section: 'occasions', icon: '❦', name: 'Weddings', sortOrder: 1,
      description: 'Whether your wedding celebration is an intimate affair created just for two, or a grand extravaganza guaranteed to grace the society pages, we have the perfect venues for you to pick from.' },
    { section: 'occasions', icon: '◇', name: 'Meetings', sortOrder: 2,
      description: 'Each of our venues is unique in its own way and can be set up to suit your particular needs and requirements, from boardroom sessions to full international conventions.' },
    { section: 'occasions', icon: '✦', name: 'World-Class Catering', sortOrder: 3,
      description: 'Pick from our various menu options available for buffets or have us cater to your own select requirements. We cater for birthday parties, corporate events, wedding receptions and christenings.' },
  ]);

  /* ---------- settings ---------- */
  const S = (key: string, label: string, value: string, group: string, valueType = 'text', sortOrder = 0, helpText?: string) =>
    ({ key, label, value, group, valueType, sortOrder, helpText: helpText ?? null });

  await insertAll(settings, [
    S('hero_video_url', 'Hero video', '/assets/hero.mp4', 'homepage', 'video', 1, 'The looping film behind the homepage headline. MP4, ideally under 3 MB.'),
    S('hero_poster_url', 'Hero poster image', '/assets/hero-poster.webp', 'homepage', 'image', 2, 'Shown while the video loads.'),
    S('hero_eyebrow', 'Hero eyebrow', 'Speke Group of Hotels', 'homepage', 'text', 3),
    S('hero_title', 'Hero headline', 'Distinctive Places Across Uganda', 'homepage', 'text', 4),
    S('hero_title_accent', 'Hero headline, gold line', 'One Warm Welcome', 'homepage', 'text', 5),
    S('hero_body', 'Hero paragraph', 'Hotels, resorts, serviced apartments and event venues, each with its own character and the same attentive service.', 'homepage', 'textarea', 6),
    S('story_title', 'Our story heading', 'A Collection Built on Ugandan Hospitality', 'homepage', 'text', 7),
    S('story_body', 'Our story paragraph', 'Our story began with Speke Hotel, a historic Kampala landmark, acquired in 1996. Since then the collection has grown to include lakeside resorts, city hotels, serviced apartments and venues for meetings and celebrations across Uganda.', 'homepage', 'textarea', 8),
    S('stat_properties', 'Number of properties', '13', 'homepage', 'number', 9),
    S('stat_rooms', 'Number of rooms', '900', 'homepage', 'number', 10),
    S('stat_conference_rooms', 'Conference rooms', '45', 'homepage', 'number', 11),
    S('stat_years', 'Years of service', '25', 'homepage', 'number', 12),

    S('contact_address_1', 'Address line 1', CONTACT.address1, 'contact', 'text', 1),
    S('contact_address_2', 'Address line 2', CONTACT.address2, 'contact', 'text', 2),
    S('contact_phone_1', 'Reservations phone 1', CONTACT.phone1, 'contact', 'text', 3),
    S('contact_phone_2', 'Reservations phone 2', CONTACT.phone2, 'contact', 'text', 4),
    S('contact_phone_3', 'Reservations phone 3', CONTACT.phone3, 'contact', 'text', 5),
    S('contact_email', 'Reservations email', CONTACT.email, 'contact', 'text', 6),
    S('contact_dining_email', 'Dining email', CONTACT.diningEmail, 'contact', 'text', 7),
    S('social_facebook', 'Facebook', CONTACT.facebook, 'contact', 'url', 8),
    S('social_twitter', 'X / Twitter', CONTACT.twitter, 'contact', 'url', 9),

    S('events_title', 'Events page headline', 'Redefining Meeting Spaces for Your Events', 'events', 'text', 1),
    S('events_body', 'Events page paragraph', 'Our facilities welcome thousands of visitors attending major national and international conventions, meetings, concerts and competitions. Ballrooms as well as indoor and outdoor conference venues make them the premier conferencing venues in Uganda.', 'events', 'textarea', 2),

    S('experiences_title', 'Experiences headline', 'Exquisite Culinary Experiences', 'experiences', 'text', 1),
    S('experiences_body', 'Experiences paragraph', 'Our restaurants focus on a contemporary yet authentic approach to traditional Continental and Asian cuisines. Rich cuisines and classic cocktails to kindle your taste buds.', 'experiences', 'textarea', 2),

    S('site_name', 'Site name', 'Speke Group of Hotels', 'general', 'text', 1),
    S('site_tagline', 'Tagline', 'Hotels, resorts, serviced apartments and event venues across Uganda.', 'general', 'text', 2),
    S('founded_year', 'Welcoming guests since', '1996', 'general', 'text', 5),
    S('footer_copyright', 'Footer copyright', 'Copyright © 2026. All Rights Reserved to Speke Group of Hotels.', 'general', 'text', 3),
    ...PAGE_IMAGE_SETTINGS.map((p) => S(p.key, p.label, p.value, p.group, 'image', p.sortOrder)),
    ...ABOUT_SETTINGS.map((a) => S(a.key, a.label, a.value, 'about', a.valueType, a.sortOrder)),
    S('enquiry_notify_email', 'Send enquiry alerts to', 'marketing@spekegroup.com', 'general', 'text', 4, 'Where a notification goes when a new enquiry arrives.'),
  ]);

  console.log(`  property links: ${await linkContentToProperties(db)}`);

  const tables = { properties, venues, restaurants, experiences, news: newsPosts, offers, settings, users };
  const counts: Record<string, number> = {};
  for (const [label, table] of Object.entries(tables)) {
    const [row] = await db.select({ n: sql<number>`count(*)` }).from(table);
    counts[label] = Number(row?.n ?? 0);
  }
  console.log('Seeded:', counts);
  console.log('Done.');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
