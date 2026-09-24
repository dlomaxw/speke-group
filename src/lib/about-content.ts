/**
 * About Us content. Rewritten 24 September 2026 from the copy Speke Group
 * supplied, which replaced the text taken from spekegroup.com: shorter, more
 * specific, and without broad claims ("unparalleled", "most preferred",
 * "only centurial hotel", "exceeding eco-friendly standards").
 *
 * Stored as site settings so staff can edit it; these are the starting values
 * and the fallbacks if a setting is cleared. Paragraphs are separated by a
 * blank line.
 *
 * Still to confirm with the client: the 13 / 900+ / 45 figures, whether the
 * room total includes apartments, the group's founding date behind
 * "Since 1996", the date of the archive photograph, and the completion dates
 * for Munyonyo Commonwealth Resort and Speke Resort Convention Centre.
 */

export const ABOUT_SETTINGS = [
  { key: 'about_eyebrow', label: 'About: small heading', valueType: 'text', sortOrder: 1,
    value: 'Welcome to Speke Group' },
  { key: 'about_title', label: 'About: page headline', valueType: 'text', sortOrder: 2,
    value: 'The Warmth of Uganda. The Welcome of Speke.' },
  { key: 'about_lead', label: 'About: opening paragraph', valueType: 'textarea', sortOrder: 3,
    value: 'Discover our collection of hotels, resorts, serviced apartments and event venues — bringing together distinctive settings, thoughtful service and warm Ugandan hospitality.' },
  { key: 'about_hero_image', label: 'About: header photo', valueType: 'image', sortOrder: 4,
    value: '/images/about-hero.webp' },

  { key: 'about_story_title', label: 'Our story: heading', valueType: 'text', sortOrder: 10,
    value: 'Distinctive Places. A Shared Spirit of Hospitality.' },
  { key: 'about_story_body', label: 'Our story: text', valueType: 'textarea', sortOrder: 11,
    value: [
      'Speke Group brings together a diverse collection of hotels, resorts, serviced apartments and event venues in Uganda. From lakeside retreats to city stays, each property offers its own character, united by a commitment to attentive service and a personal welcome.',
      'Our collection welcomes business travellers, holidaymakers, families and guests seeking the comfort of a longer stay. Across our properties, accommodation, dining, leisure and event facilities offer places to relax, connect and celebrate.',
      'Meetings and events are an important part of our story. From private gatherings to international conferences at Speke Resort Convention Centre, we bring people together in settings suited to the occasion.',
      'At the heart of every experience are our people, whose care and attention help guests feel welcome from arrival to departure.',
    ].join('\n\n') },
  { key: 'about_story_image', label: 'Our story: photo', valueType: 'image', sortOrder: 12,
    value: '/images/about-story.webp' },

  { key: 'about_history_title', label: 'Our history: heading', valueType: 'text', sortOrder: 20,
    value: 'From a Kampala Landmark to a Growing Hospitality Collection' },
  { key: 'about_history_body', label: 'Our history: text', valueType: 'textarea', sortOrder: 21,
    value: [
      'Our story began with Speke Hotel, a historic landmark in the heart of Kampala whose origins date to the 1920s. Its acquisition by Dr. Sudhir Ruparelia in 1996 marked the beginning of the hospitality collection that would become Speke Group.',
      'Over the years, the collection expanded to include resorts, city hotels, serviced apartments and spaces for meetings and celebrations. Each addition has brought a new setting and experience while retaining its individual character.',
      'Today, that journey continues through investment in hospitality, guided by a commitment to our guests, our people and Uganda’s future as a destination for business and leisure.',
    ].join('\n\n') },
  { key: 'about_history_image', label: 'Our history: photo', valueType: 'image', sortOrder: 22,
    value: '/images/about-history-1960.webp' },
  { key: 'about_history_caption', label: 'Our history: photo caption', valueType: 'text', sortOrder: 23,
    value: 'Speke Hotel, Kampala — a historic view' },

  { key: 'chairman_role', label: 'Chairman: small heading', valueType: 'text', sortOrder: 30,
    value: 'A Message from Our Chairman' },
  { key: 'chairman_name', label: 'Chairman: name', valueType: 'text', sortOrder: 31,
    value: 'Dr. Sudhir Ruparelia' },
  { key: 'chairman_tagline', label: 'Chairman: line under the name', valueType: 'text', sortOrder: 32,
    value: 'Rooted in Uganda. Investing in Its Future.' },
  { key: 'chairman_image', label: 'Chairman: portrait', valueType: 'image', sortOrder: 33,
    value: '/images/about-chairman.webp' },
  { key: 'chairman_quote', label: 'Chairman: highlighted quote', valueType: 'textarea', sortOrder: 34,
    value: 'Uganda is our home, and we are proud to share in its growth, dreams and aspirations.' },
  { key: 'chairman_body', label: 'Chairman: message', valueType: 'textarea', sortOrder: 35,
    value: [
      'From modest entrepreneurial beginnings in the 1980s, Ruparelia Group has grown into a diversified business group with investments across real estate, education, hospitality, floriculture, financial services, insurance and media. Our journey reflects a lasting belief in Uganda’s potential and a commitment to building businesses that create employment, develop skills and contribute to the country’s progress.',
      'Speke Group is the hospitality arm of this wider group, drawing on its experience, resources and long-term vision. From our beginnings with the historic Speke Hotel, we have developed a collection of hotels, resorts, serviced apartments and event venues, each with its own character and a shared commitment to welcoming our guests with warmth and care.',
      'Through continued investment in our properties and people, we are helping to strengthen Uganda’s appeal as a destination for business, international conferences and leisure. As we grow, our purpose remains personal: to create places where guests feel welcome, relationships flourish and people look forward to returning.',
    ].join('\n\n') },

  { key: 'about_today_title', label: 'Today: heading', valueType: 'text', sortOrder: 40,
    value: 'A Growing Collection. A Personal Welcome.' },
  { key: 'about_today_body', label: 'Today: text', valueType: 'textarea', sortOrder: 41,
    value: [
      'Whether you are planning a business trip, a relaxing escape, an extended stay or a special occasion, discover a Speke Group property to suit your plans.',
      'Our collection continues to evolve, shaped by the dedication of our teams and the relationships we build with our guests and partners. Across every property, our focus remains on thoughtful service, comfort and the details that make you feel welcome.',
    ].join('\n\n') },
] as const;

export const ABOUT_DEFAULTS: Record<string, string> = Object.fromEntries(
  ABOUT_SETTINGS.map((s) => [s.key, s.value]),
);
