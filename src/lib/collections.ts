import {
  properties, venues, restaurants, experiences, newsPosts,
  offers, milestones, highlightBlocks, venueGroups,
} from '@/db/schema';

export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'number' | 'url'
  | 'image' | 'select' | 'checkbox' | 'date' | 'status' | 'property';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  /** Hide from the form but keep in the table. */
  listOnly?: boolean;
};

export type CollectionConfig = {
  slug: string;
  label: string;
  singular: string;
  description: string;
  /** The drizzle table. Chosen at runtime, so it cannot be statically typed
   *  here; the admin CRUD paths use getDynamicDb() to match. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any;
  /** Columns shown in the list view. */
  listFields: string[];
  fields: Field[];
  defaultSort: 'sortOrder' | 'publishedAt' | 'name';
  /** Content with a draft/published gate. */
  hasStatus: boolean;
  /**
   * How a record maps to a property, for staff limited to certain properties:
   * 'id' (the record is a property), 'propertyId' (a column), or undefined for
   * group-wide content only unrestricted staff may change.
   */
  propertyField?: 'id' | 'propertyId';
  icon: string;
};

const STATUS_FIELD: Field = {
  name: 'status', label: 'Status', type: 'status',
  help: 'Drafts stay off the public site. Only a manager or administrator can publish.',
  options: [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
  ],
};

const SORT_FIELD: Field = {
  name: 'sortOrder', label: 'Display order', type: 'number',
  help: 'Lower numbers appear first.',
};

export const COLLECTIONS: CollectionConfig[] = [
  {
    slug: 'properties',
    label: 'Portfolio',
    singular: 'Property',
    description: 'The hotels, resorts, convention centre and apartments shown on the homepage.',
    table: properties,
    icon: 'building',
    defaultSort: 'sortOrder',
    hasStatus: true,
    propertyField: 'id',
    listFields: ['name', 'categoryLabel', 'area', 'status'],
    fields: [
      { name: 'name', label: 'Property name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true, help: 'Used in links. Lowercase, hyphens instead of spaces.' },
      { name: 'kind', label: 'Type', type: 'select', required: true, options: [
        { value: 'hotel', label: 'Hotel' },
        { value: 'resort', label: 'Resort' },
        { value: 'convention', label: 'Convention Centre' },
        { value: 'apartment', label: 'Apartment' },
      ], help: 'Drives the filter buttons on the homepage.' },
      { name: 'categoryLabel', label: 'Category label', type: 'text', help: 'The small gold text above the name on the card.' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'area', label: 'Area', type: 'text', placeholder: 'Bukoto, Kampala' },
      { name: 'websiteUrl', label: "Property's own website", type: 'url', placeholder: 'https://…' },
      { name: 'imageUrl', label: 'Photo', type: 'image' },
      { name: 'imageAlt', label: 'Photo description', type: 'text', help: 'Describes the photo for screen readers and search engines.' },
      SORT_FIELD, STATUS_FIELD,
    ],
  },
  {
    slug: 'venues',
    label: 'Meeting venues',
    singular: 'Venue',
    description: 'Conference rooms, ballrooms and outdoor spaces on the events page.',
    table: venues,
    icon: 'calendar',
    defaultSort: 'sortOrder',
    hasStatus: true,
    propertyField: 'propertyId',
    listFields: ['name', 'location', 'capacity', 'status'],
    fields: [
      { name: 'name', label: 'Venue name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'propertyId', label: 'Property', type: 'property', help: 'Which property this belongs to. Leave as group-wide if it covers several.' },
      { name: 'location', label: 'Location label', type: 'text', required: true, placeholder: 'Kabira Country Club', help: 'The text shown on the venue card.' },
      { name: 'capacity', label: 'Capacity', type: 'text', placeholder: '120 guests' },
      { name: 'venueSize', label: 'Venue size', type: 'text', placeholder: '62 sq m or Ballroom' },
      { name: 'sizeTag', label: 'Capacity bracket', type: 'select', options: [
        { value: 's10', label: '10 – 35 guests' },
        { value: 's50', label: '50 – 100 guests' },
        { value: 's120', label: '120 – 400 guests' },
        { value: 's1000', label: '1000 – 1400 guests' },
      ], help: 'Which filter button shows this venue.' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'imageUrl', label: 'Photo', type: 'image' },
      { name: 'imageAlt', label: 'Photo description', type: 'text' },
      SORT_FIELD, STATUS_FIELD,
    ],
  },
  {
    slug: 'restaurants',
    label: 'Restaurants & bars',
    singular: 'Venue',
    description: 'Dining rooms and bars listed on the experiences page.',
    table: restaurants,
    icon: 'utensils',
    defaultSort: 'sortOrder',
    hasStatus: true,
    propertyField: 'propertyId',
    listFields: ['name', 'kind', 'cuisine', 'status'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'propertyId', label: 'Property', type: 'property', help: 'Which property this belongs to. Leave as group-wide if it covers several.' },
      { name: 'kind', label: 'Type', type: 'select', required: true, options: [
        { value: 'restaurant', label: 'Restaurant' },
        { value: 'bar', label: 'Bar' },
      ] },
      { name: 'cuisine', label: 'Cuisine', type: 'text', placeholder: 'Multi Cuisine' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'openingTimes', label: 'Opening times', type: 'text' },
      { name: 'dressCode', label: 'Dress code', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'imageUrl', label: 'Photo', type: 'image' },
      { name: 'imageAlt', label: 'Photo description', type: 'text' },
      SORT_FIELD, STATUS_FIELD,
    ],
  },
  {
    slug: 'experiences',
    label: 'Experiences',
    singular: 'Experience',
    description: 'Spas, gyms, the marina, equestrian, lakeside and pools.',
    table: experiences,
    icon: 'sparkles',
    defaultSort: 'sortOrder',
    hasStatus: true,
    listFields: ['name', 'highlights', 'status'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'highlights', label: 'Highlights', type: 'text', help: 'Short points separated by ·  for example: Fishing · Boat trips' },
      { name: 'imageUrl', label: 'Photo', type: 'image' },
      { name: 'imageAlt', label: 'Photo description', type: 'text' },
      SORT_FIELD, STATUS_FIELD,
    ],
  },
  {
    slug: 'news',
    label: 'News',
    singular: 'Story',
    description: 'Announcements and stories for the newsroom.',
    table: newsPosts,
    icon: 'newspaper',
    defaultSort: 'publishedAt',
    hasStatus: true,
    propertyField: 'propertyId',
    listFields: ['title', 'propertyLabel', 'publishedAt', 'status'],
    fields: [
      { name: 'title', label: 'Headline', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'text', required: true },
      { name: 'propertyId', label: 'Property', type: 'property', help: 'Which property this belongs to. Leave as group-wide if it covers several.' },
      { name: 'propertyLabel', label: 'Property label', type: 'text', placeholder: 'Group', help: 'Shown above the headline.' },
      { name: 'tag', label: 'Category', type: 'select', options: [
        { value: 'group', label: 'Group' },
        { value: 'property', label: 'Properties' },
        { value: 'events', label: 'Events' },
      ] },
      { name: 'excerpt', label: 'Summary', type: 'textarea', help: 'The short paragraph shown on the news card.' },
      { name: 'body', label: 'Full story', type: 'richtext' },
      { name: 'imageUrl', label: 'Photo', type: 'image' },
      { name: 'imageAlt', label: 'Photo description', type: 'text' },
      { name: 'publishedAt', label: 'Publish date', type: 'date' },
      { name: 'isFeatured', label: 'Feature at the top of the news page', type: 'checkbox' },
      STATUS_FIELD,
    ],
  },
  {
    slug: 'offers',
    label: 'Packages & offers',
    singular: 'Offer',
    description: 'The tabbed offers on the homepage.',
    table: offers,
    icon: 'tag',
    defaultSort: 'sortOrder',
    hasStatus: true,
    propertyField: 'propertyId',
    listFields: ['name', 'category', 'propertyLabel', 'status'],
    fields: [
      { name: 'name', label: 'Offer name', type: 'text', required: true },
      { name: 'propertyId', label: 'Property', type: 'property', help: 'Which property this belongs to. Leave as group-wide if it covers several.' },
      { name: 'category', label: 'Tab', type: 'select', required: true, options: [
        { value: 'accommodation', label: 'Accommodation' },
        { value: 'dining', label: 'Dining' },
        { value: 'events', label: 'Events' },
        { value: 'spa', label: 'Spa' },
      ] },
      { name: 'propertyLabel', label: 'Property label', type: 'text', help: 'The small gold text on the offer card.' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'imageUrl', label: 'Photo', type: 'image' },
      { name: 'linkUrl', label: 'Link', type: 'url' },
      SORT_FIELD, STATUS_FIELD,
    ],
  },
  {
    slug: 'milestones',
    label: 'Milestones',
    singular: 'Milestone',
    description: 'The history timeline on the news page.',
    table: milestones,
    icon: 'flag',
    defaultSort: 'sortOrder',
    hasStatus: false,
    listFields: ['year', 'title'],
    fields: [
      { name: 'year', label: 'Year', type: 'text', required: true, placeholder: '1996' },
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      SORT_FIELD,
    ],
  },
  {
    slug: 'highlights',
    label: 'Highlight blocks',
    singular: 'Block',
    description: '"Why stay with us" tiles and "Occasions we host".',
    table: highlightBlocks,
    icon: 'grid',
    defaultSort: 'sortOrder',
    hasStatus: false,
    listFields: ['name', 'section'],
    fields: [
      { name: 'section', label: 'Section', type: 'select', required: true, options: [
        { value: 'pillars', label: 'Why stay with us' },
        { value: 'occasions', label: 'Occasions we host' },
      ] },
      { name: 'name', label: 'Title', type: 'text', required: true },
      { name: 'icon', label: 'Symbol', type: 'text', placeholder: '◇', help: 'A single decorative character.' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'linkUrl', label: 'Link', type: 'url' },
      SORT_FIELD,
    ],
  },
  {
    slug: 'venue-groups',
    label: 'Venue index',
    singular: 'Group',
    description: 'The grouped list of every venue, by property.',
    table: venueGroups,
    icon: 'list',
    defaultSort: 'sortOrder',
    hasStatus: false,
    listFields: ['groupName'],
    fields: [
      { name: 'groupName', label: 'Property', type: 'text', required: true },
      { name: 'venueList', label: 'Venues', type: 'textarea', required: true, help: 'Separate each venue with ·' },
      SORT_FIELD,
    ],
  },
];

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug) ?? null;
}
