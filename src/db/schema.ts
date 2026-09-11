import {
  pgTable, serial, text, varchar, integer, boolean,
  timestamp, jsonb, pgEnum, index, uniqueIndex,
} from 'drizzle-orm/pg-core';

/* ============================================================
   Enums
   ============================================================ */

/** Admin = IT, Manager = GM, Marketing = create/edit, Viewer = read-only. */
export const roleEnum = pgEnum('role', ['admin', 'manager', 'marketing', 'viewer']);

/** Marketing saves drafts; a Manager or Admin moves them to published. */
export const statusEnum = pgEnum('status', ['draft', 'published']);

export const propertyKindEnum = pgEnum('property_kind', [
  'hotel', 'resort', 'convention', 'apartment',
]);

export const enquiryStatusEnum = pgEnum('enquiry_status', [
  'new', 'assigned', 'answered', 'closed', 'spam',
]);

export const enquiryKindEnum = pgEnum('enquiry_kind', [
  'general', 'stay', 'event', 'dining', 'careers', 'press',
]);

/* ============================================================
   People
   ============================================================ */

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull().default('viewer'),
  department: varchar('department', { length: 80 }),
  isActive: boolean('is_active').notNull().default(true),
  /** Forces a password change on next sign-in after an admin reset. */
  mustChangePassword: boolean('must_change_password').notNull().default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('users_email_idx').on(t.email)]);

/** Every content change is recorded so a GM can see who altered what. */
export const activityLog = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: varchar('user_email', { length: 255 }),
  action: varchar('action', { length: 40 }).notNull(),   // created | updated | deleted | published
  entity: varchar('entity', { length: 60 }).notNull(),   // properties | news | ...
  entityId: varchar('entity_id', { length: 60 }),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('activity_created_idx').on(t.createdAt)]);

/* ============================================================
   Media
   ============================================================ */

export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  /** Public URL. Blob storage in production, /uploads in development. */
  url: text('url').notNull(),
  pathname: text('pathname'),
  filename: varchar('filename', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }),
  bytes: integer('bytes'),
  width: integer('width'),
  height: integer('height'),
  /** Alt text matters for accessibility and for search engines. */
  alt: varchar('alt', { length: 300 }),
  credit: varchar('credit', { length: 200 }),
  folder: varchar('folder', { length: 80 }).default('general'),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('media_folder_idx').on(t.folder)]);

/* ============================================================
   Site content
   ============================================================ */

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  kind: propertyKindEnum('kind').notNull().default('hotel'),
  categoryLabel: varchar('category_label', { length: 60 }).notNull().default('Hotel'),
  description: text('description'),
  /** The property's own website, e.g. spekehotel.com. */
  websiteUrl: text('website_url'),
  area: varchar('area', { length: 160 }),
  imageUrl: text('image_url'),
  imageAlt: varchar('image_alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: statusEnum('status').notNull().default('published'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('properties_slug_idx').on(t.slug)]);

export const venues = pgTable('venues', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  location: varchar('location', { length: 160 }).notNull(),
  capacity: varchar('capacity', { length: 80 }),
  venueSize: varchar('venue_size', { length: 80 }),
  /** Capacity bracket used by the filter chips, e.g. s10 / s50 / s120 / s1000. */
  sizeTag: varchar('size_tag', { length: 20 }).notNull().default('s10'),
  description: text('description'),
  imageUrl: text('image_url'),
  imageAlt: varchar('image_alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: statusEnum('status').notNull().default('published'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('venues_slug_idx').on(t.slug)]);

/** The grouped "complete venue index" block on the events page. */
export const venueGroups = pgTable('venue_groups', {
  id: serial('id').primaryKey(),
  groupName: varchar('group_name', { length: 160 }).notNull(),
  venueList: text('venue_list').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const restaurants = pgTable('restaurants', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  cuisine: varchar('cuisine', { length: 120 }),
  description: text('description'),
  /** 'restaurant' or 'bar' — same shape, two lists on the page. */
  kind: varchar('kind', { length: 20 }).notNull().default('restaurant'),
  imageUrl: text('image_url'),
  imageAlt: varchar('image_alt', { length: 300 }),
  openingTimes: varchar('opening_times', { length: 200 }),
  dressCode: varchar('dress_code', { length: 120 }),
  phone: varchar('phone', { length: 60 }),
  email: varchar('email', { length: 160 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: statusEnum('status').notNull().default('published'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('restaurants_slug_idx').on(t.slug)]);

export const experiences = pgTable('experiences', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 120 }).notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  /** Short bullet points shown under the description. */
  highlights: text('highlights'),
  imageUrl: text('image_url'),
  imageAlt: varchar('image_alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: statusEnum('status').notNull().default('published'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex('experiences_slug_idx').on(t.slug)]);

export const newsPosts = pgTable('news_posts', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 160 }).notNull(),
  title: varchar('title', { length: 250 }).notNull(),
  excerpt: text('excerpt'),
  body: text('body'),
  /** Free text so it can read "Kabira Country Club" or simply "Group". */
  propertyLabel: varchar('property_label', { length: 120 }).default('Group'),
  tag: varchar('tag', { length: 40 }).default('group'),
  imageUrl: text('image_url'),
  imageAlt: varchar('image_alt', { length: 300 }),
  isFeatured: boolean('is_featured').notNull().default(false),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  status: statusEnum('status').notNull().default('draft'),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex('news_slug_idx').on(t.slug),
  index('news_published_idx').on(t.publishedAt),
]);

export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  propertyLabel: varchar('property_label', { length: 120 }),
  description: text('description'),
  /** accommodation | dining | events | spa — drives the homepage tabs. */
  category: varchar('category', { length: 40 }).notNull().default('accommodation'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: statusEnum('status').notNull().default('published'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const milestones = pgTable('milestones', {
  id: serial('id').primaryKey(),
  year: varchar('year', { length: 20 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Small repeated blocks: "Why stay with us" tiles and "Occasions we host". */
export const highlightBlocks = pgTable('highlight_blocks', {
  id: serial('id').primaryKey(),
  section: varchar('section', { length: 40 }).notNull(), // pillars | occasions
  icon: varchar('icon', { length: 12 }),
  name: varchar('name', { length: 160 }).notNull(),
  description: text('description'),
  linkUrl: text('link_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('highlight_section_idx').on(t.section)]);

/* ============================================================
   Settings — headings, hero video, contact details, stats
   ============================================================ */

export const settings = pgTable('settings', {
  key: varchar('key', { length: 80 }).primaryKey(),
  value: text('value'),
  /** text | textarea | url | image | video | number — picks the editor field. */
  valueType: varchar('value_type', { length: 20 }).notNull().default('text'),
  label: varchar('label', { length: 160 }).notNull(),
  helpText: text('help_text'),
  group: varchar('group', { length: 60 }).notNull().default('general'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('settings_group_idx').on(t.group)]);

/* ============================================================
   Enquiries — the contact form lands here for the marketing team
   ============================================================ */

export const enquiries = pgTable('enquiries', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 60 }),
  subject: varchar('subject', { length: 250 }),
  message: text('message').notNull(),
  kind: enquiryKindEnum('kind').notNull().default('general'),
  status: enquiryStatusEnum('status').notNull().default('new'),
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  internalNote: text('internal_note'),
  /** Kept for spam triage, never shown on the public site. */
  sourcePage: varchar('source_page', { length: 160 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('enquiries_status_idx').on(t.status),
  index('enquiries_created_idx').on(t.createdAt),
]);

export type User = typeof users.$inferSelect;
export type Role = User['role'];
export type Enquiry = typeof enquiries.$inferSelect;
export type NewsPost = typeof newsPosts.$inferSelect;
export type Property = typeof properties.$inferSelect;
