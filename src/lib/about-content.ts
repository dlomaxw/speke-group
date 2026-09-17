/**
 * About Us content, from https://spekegroup.com/about-us/ (reviewed
 * 17 September 2026). Stored as site settings so staff can edit it; these are
 * the starting values and the fallbacks if a setting is cleared.
 * Paragraphs are separated by a blank line.
 *
 * Two obvious slips in the source were corrected: the explorer's name
 * (John Hanning Speke, not "Hannington") and "bear testament" (not "bare").
 */

export const ABOUT_SETTINGS = [
  { key: 'about_eyebrow', label: 'About: small heading', valueType: 'text', sortOrder: 1,
    value: 'Welcome to the Speke Group of Hotels' },
  { key: 'about_title', label: 'About: page headline', valueType: 'text', sortOrder: 2,
    value: 'Unmatched Hospitality and Elegance' },
  { key: 'about_hero_image', label: 'About: header photo', valueType: 'image', sortOrder: 3,
    value: '/images/about-hero.webp' },

  { key: 'about_story_title', label: 'Our story: heading', valueType: 'text', sortOrder: 10,
    value: 'A Pioneer of Ugandan Hospitality' },
  { key: 'about_story_body', label: 'Our story: text', valueType: 'textarea', sortOrder: 11,
    value: [
      'As one of the pioneers of the hospitality industry in Uganda, we began our journey by acquiring the most historic hotel in the country, Speke Hotel. Over the years, we have passionately built a collection of resorts, hotels and apartments to an international standard, creating unique experiences and everlasting memories for all our guests.',
      'With over 25 years of experience, we have curated and cultivated the definition of warmth and tranquillity for all our guests during their stay across our various properties.',
      'Our award-winning resorts, hotels and apartments offer Uganda’s most exquisite accommodation, which bear testament to an imposing luxury and a charm waiting to be experienced. Our service delivery has grown over time to meet and exceed the luxury and eco-friendly standards on the market. The central locations, exclusive views and superb culinary delights of our restaurants are a distinctive feature of the Speke Group properties. We provide our guests with unforgettable experiences, a personalised welcome and unparalleled comfort.',
      'Speke Group offers more than 900 modern rooms, 45 state-of-the-art conference and meeting rooms, award-winning restaurants and bars, health clubs and spas, and recreation and leisure facilities to make your stay with us a once-in-a-lifetime experience.',
    ].join('\n\n') },
  { key: 'about_story_image', label: 'Our story: photo', valueType: 'image', sortOrder: 12,
    value: '/images/about-story.webp' },

  { key: 'about_history_title', label: 'Our history: heading', valueType: 'text', sortOrder: 20,
    value: 'A Name Rooted in the Source of the Nile' },
  { key: 'about_history_body', label: 'Our history: text', valueType: 'textarea', sortOrder: 21,
    value: [
      'The story of the Speke Group dates back to the legend of Captain John Hanning Speke, from whom the Group takes its name. The British explorer is credited as the first European to discover Lake Victoria in East Africa, which he correctly identified as the source of the Nile. It is this prestigious background that set the stage for the naming of Uganda’s only centurial hotel, Speke Hotel.',
      'Speke Hotel was the first hotel to be acquired as a member of the Ruparelia Group, in 1996, by Dr. Sudhir Ruparelia. Its unrivalled heritage has made Speke Hotel a key destination in the heart of Kampala, draped in a colonial ambiance that can be traced back to the 1920s when the hotel was built, an aura maintained and preserved over the years.',
      'The dedication and vision to keep creating luxurious, modern accommodation with a true sense of warm hospitality grew gradually. The next stage in the Group’s expansion came ten years later, in 2006, with the completion of Munyonyo Commonwealth Resort in a record 11 months. Shortly after, Kabira Country Club was added to the Group, offering a world-class abode for guests and travellers.',
    ].join('\n\n') },
  { key: 'about_history_image', label: 'Our history: photo', valueType: 'image', sortOrder: 22,
    value: '/images/about-history-1960.webp' },
  { key: 'about_history_caption', label: 'Our history: photo caption', valueType: 'text', sortOrder: 23,
    value: 'Speke Hotel, Kampala, in the 1960s' },

  { key: 'chairman_role', label: 'Chairman: title', valueType: 'text', sortOrder: 30,
    value: 'Chairman – Speke Group of Hotels' },
  { key: 'chairman_name', label: 'Chairman: name', valueType: 'text', sortOrder: 31,
    value: 'Dr. Sudhir Ruparelia' },
  { key: 'chairman_image', label: 'Chairman: portrait', valueType: 'image', sortOrder: 32,
    value: '/images/about-chairman.webp' },
  { key: 'chairman_quote', label: 'Chairman: highlighted quote', valueType: 'textarea', sortOrder: 33,
    value: 'Uganda is very special to us because it is our home, and we are proud to share and participate in her growth, dreams and aspirations.' },
  { key: 'chairman_body', label: 'Chairman: message', valueType: 'textarea', sortOrder: 34,
    value: [
      'Over the last 25 years, we have invested billions of shillings in key sectors such as real estate, education, hospitality and financial services; projects that have facilitated and accelerated the country’s economic growth through the creation of jobs, the paying of taxes and the transfer of skills, and, more importantly, by creating the much-needed soft infrastructure to oil the wheels of growth.',
      'Speke Group of Hotels has grown through the hospitality sector, ensuring that each hotel and property thrives under its own identity, successfully merging the establishment’s inherent characteristics with Speke Group core values.',
    ].join('\n\n') },

  { key: 'about_today_title', label: 'Today: heading', valueType: 'text', sortOrder: 40,
    value: 'Thirteen Properties, One Legacy' },
  { key: 'about_today_body', label: 'Today: text', valueType: 'textarea', sortOrder: 41,
    value: [
      'Today, the Speke Group of Hotels has a total of 13 resorts, hotels and apartments providing the best service, value and amenities, making it the most preferred modern and innovative choice for Uganda’s leisure and luxury seekers.',
      'The Speke Group has grown to be a resounding success because of the vision and forward-thinking approach, as well as the impeccable work ethic, of key managers such as Mr. Azim Tharani, Mr. Amit Sachdeva, Mr. Greg Petzer and Mr. Akhilesh Malik, who have been instrumental in developing the Speke Group of Hotels to the point where Uganda’s hospitality industry has been transformed. The Group continues to build a legacy that will live on for many years to come, with new properties being added to the illustrious story unfolding before your eyes.',
    ].join('\n\n') },
] as const;

export const ABOUT_DEFAULTS: Record<string, string> = Object.fromEntries(
  ABOUT_SETTINGS.map((s) => [s.key, s.value]),
);
