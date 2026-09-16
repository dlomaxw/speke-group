/**
 * The photographs that shipped with the original site, keyed by record slug.
 * Used to seed image fields, and as a fallback so a record whose image was
 * cleared still renders a picture instead of an empty frame.
 */

export const PROPERTY_IMAGES: Record<string, string> = {
  'speke-hotel': '/images/p-speke-hotel.webp',
  'kabira-country-club': '/images/p-kabira.webp',
  'forest-cottages-hotel': '/images/p-forest-cottages.webp',
  'dolphin-suites-hotel': '/images/p-dolphin-suites.webp',
  'speke-resort-munyonyo': '/images/p-munyonyo-resort.webp',
  'munyonyo-commonwealth-resort': '/images/p-commonwealth-resort.webp',
  'speke-resort-convention-centre': '/images/p-convention-centre.webp',
  'speke-apartments-wampewo': '/images/p-wampewo.webp',
  'speke-apartments-kitante': '/images/p-kitante.webp',
  'boulevard-suites': '/images/p-boulevard-suites.webp',
  'bukoto-heights': '/images/p-bukoto-heights.webp',
  'tagore-apartments': '/images/p-tagore.webp',
  'naguru-apartments': '/images/p-naguru.webp',
};

export const VENUE_IMAGES: Record<string, string> = {
  'kabira-ballroom': '/images/v-kabira-ballroom.webp',
  palm: '/images/v-palm.webp',
  pine: '/images/v-pine.webp',
  acacia: '/images/v-acacia.webp',
  oak: '/images/v-oak.webp',
  jacaranda: '/images/v-jacaranda.webp',
  sapphire: '/images/v-sapphire.webp',
  amethyst: '/images/v-amethyst.webp',
  sanga: '/images/v-sanga.webp',
  'victoria-ballroom': '/images/v-victoria.webp',
  'speke-ballroom': '/images/v-speke-ballroom.webp',
  'commonwealth-banquet-hall': '/images/v-commonwealth-hall.webp',
};

export const DINING_IMAGES: Record<string, string> = {
  nyanja: '/images/r-nyanja.webp',
  'the-stables': '/images/r-stables.webp',
  'lake-grill': '/images/r-lake-grill.webp',
  'pool-side-restaurant': '/images/r-poolside.webp',
  'the-pub': '/images/r-pub.webp',
  'la-cabana': '/images/r-la-cabana.webp',
  'khyber-pass': '/images/r-khyber.webp',
  'viking-bar': '/images/b-viking.webp',
  'rock-bar': '/images/b-rock.webp',
  'forest-cottages-bar': '/images/b-forest.webp',
  'heights-bar-cafe': '/images/b-heights.webp',
};

export const EXPERIENCE_IMAGES: Record<string, string> = {
  'spas-and-salons': '/images/l-spa.webp',
  gyms: '/images/l-gym.webp',
  'marina-experience': '/images/l-marina.webp',
  equestrian: '/images/l-equestrian.webp',
  lakeside: '/images/l-lakeside.webp',
  'swimming-pools': '/images/l-pools.webp',
};

/** In-page anchors the header's Experiences menu links to. */
export const EXPERIENCE_ANCHORS: Record<string, string> = {
  'spas-and-salons': 'spas',
  gyms: 'gyms',
  'marina-experience': 'marina',
  equestrian: 'equestrian',
  lakeside: 'lakeside-card',
  'swimming-pools': 'pools',
};

export const NEWS_IMAGES: Record<string, string> = {
  'speke-resort-munyonyo-completes-room-renovation': '/images/n-1.webp',
  'speke-group-named-ugandas-leading-hospitality-employer': '/images/n-2.webp',
  'kabira-country-club-hosts-national-golf-open': '/images/n-3.webp',
  'new-wing-opens-at-speke-resort-convention-centre': '/images/n-4.webp',
  'dolphin-suites-launches-long-stay-packages': '/images/n-5.webp',
  'speke-group-marks-25-years': '/images/n-6.webp',
  'spa-treatment-menu-refreshed': '/images/n-7.webp',
};

/** Page photographs that are not tied to a record; edited under Settings. */
export const PAGE_IMAGE_SETTINGS = [
  { key: 'home_meetings_image', label: 'Homepage events banner image', group: 'homepage', sortOrder: 20, value: '/images/meetings-bg.webp' },
  { key: 'home_careers_image', label: 'Homepage careers photo', group: 'homepage', sortOrder: 21, value: '/images/careers-photo.webp' },
  { key: 'home_news_image', label: 'Homepage news photo', group: 'homepage', sortOrder: 22, value: '/images/news-photo.webp' },
  { key: 'events_hero_image', label: 'Events hero image', group: 'events', sortOrder: 3, value: '/images/meet-hero.webp' },
  { key: 'events_cta_image', label: 'Events contact banner image', group: 'events', sortOrder: 4, value: '/images/meet-cta-bg.webp' },
  { key: 'experiences_hero_image', label: 'Experiences hero image', group: 'experiences', sortOrder: 3, value: '/images/dine-hero.webp' },
  { key: 'experiences_lakeside_image', label: 'Lake Grill feature photo', group: 'experiences', sortOrder: 4, value: '/images/lakeside-photo.webp' },
  { key: 'contact_map_image', label: 'Contact page location image', group: 'contact', sortOrder: 20, value: '/images/contact-map.webp' },
] as const;

/** Offers on the original site that the first seed left out. */
export const EXTRA_OFFERS = [
  { category: 'accommodation', propertyLabel: 'Speke Apartments Kitante', name: 'Kitante Apartment Offer', description: 'Serviced apartment rates for longer stays.', sortOrder: 5 },
  { category: 'accommodation', propertyLabel: 'Group Wide', name: 'Monthly Staycation', description: 'Month-long staycation rates for residents and visitors.', sortOrder: 6 },
  { category: 'accommodation', propertyLabel: 'Kabira Country Club', name: 'Weekly Bonanza', description: 'A weekly package at Kabira Country Club.', sortOrder: 7 },
  { category: 'accommodation', propertyLabel: 'Bukoto Heights', name: 'Where Every Stay Is a Memory', description: 'Signature stay package at Bukoto Heights.', sortOrder: 8 },
  { category: 'dining', propertyLabel: 'Speke Resort', name: 'Flavour Fest', description: "A rotating showcase of the resort's kitchens.", sortOrder: 2 },
  { category: 'dining', propertyLabel: 'Speke Resort', name: 'Thirsty Thursday', description: 'Midweek drinks offer at the resort bars.', sortOrder: 4 },
  { category: 'dining', propertyLabel: 'Kabira Country Club', name: 'Sip & Chill', description: 'Relaxed evening drinks at Kabira Country Club.', sortOrder: 6 },
  { category: 'dining', propertyLabel: 'Kabira Country Club', name: 'Little Chefs', description: 'A cooking experience for younger guests.', sortOrder: 7 },
];

/** Reference order of every offer, so a fresh seed matches the original tabs. */
export const OFFER_ORDER: Record<string, number> = {
  'Getaway at Speke Resort': 1, 'Your Home, Refined': 2, 'Kumi na Tani — 15 Days': 3, 'Midweek Getaway': 4,
  'Kitante Apartment Offer': 5, 'Monthly Staycation': 6, 'Weekly Bonanza': 7, 'Where Every Stay Is a Memory': 8,
  'Cocktail Culture': 1, 'Flavour Fest': 2, 'Soulful Sunday Feast': 3, 'Thirsty Thursday': 4,
  'Mongolian Fridays': 5, 'Sip & Chill': 6, 'Little Chefs': 7, 'Business Lunch': 8,
};
