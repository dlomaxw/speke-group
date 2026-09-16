import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

/*
 * SQLite schema (Cloudflare D1 in production, a local SQLite file in
 * development). Enums are text columns with a fixed value list, booleans are
 * 0/1 integers and timestamps are stored as epoch milliseconds; drizzle maps
 * all three back to the same TypeScript types the app already uses.
 */

/* ============================================================
   Enums
   ============================================================ */

/** Admin = IT, Manager = GM, Marketing = create/edit, Viewer = read-only. */
export const roleEnum = ['admin', 'manager', 'marketing', 'viewer'] as const;

/** Marketing saves drafts; a Manager or Admin moves them to published. */
export const statusEnum = ['draft', 'published'] as const;

export const propertyKindEnum = [
  'hotel', 'resort', 'convention', 'apartment',
] as const;

export const enquiryStatusEnum = [
  'new', 'assigned', 'answered', 'closed', 'spam',
] as const;

export const enquiryKindEnum = [
  'general', 'stay', 'event', 'dining', 'careers', 'press',
] as const;

/* ============================================================
   People
   ============================================================ */

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email', { length: 255 }).notNull(),
  name: text('name', { length: 120 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: roleEnum }).notNull().default('viewer'),
  department: text('department', { length: 80 }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  /** Forces a password change on next sign-in after an admin reset. */
  mustChangePassword: integer('must_change_password', { mode: 'boolean' }).notNull().default(false),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('users_email_idx').on(t.email)]);

/** Every content change is recorded so a GM can see who altered what. */
export const activityLog = sqliteTable('activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  userEmail: text('user_email', { length: 255 }),
  action: text('action', { length: 40 }).notNull(),   // created | updated | deleted | published
  entity: text('entity', { length: 60 }).notNull(),   // properties | news | ...
  entityId: text('entity_id', { length: 60 }),
  summary: text('summary'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [index('activity_created_idx').on(t.createdAt)]);

/* ============================================================
   Media
   ============================================================ */

export const media = sqliteTable('media', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  /** Public URL. Blob storage in production, /uploads in development. */
  url: text('url').notNull(),
  pathname: text('pathname'),
  filename: text('filename', { length: 255 }).notNull(),
  contentType: text('content_type', { length: 100 }),
  bytes: integer('bytes'),
  width: integer('width'),
  height: integer('height'),
  /** Alt text matters for accessibility and for search engines. */
  alt: text('alt', { length: 300 }),
  credit: text('credit', { length: 200 }),
  folder: text('folder', { length: 80 }).default('general'),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [index('media_folder_idx').on(t.folder)]);

/* ============================================================
   Site content
   ============================================================ */

export const properties = sqliteTable('properties', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug', { length: 120 }).notNull(),
  name: text('name', { length: 160 }).notNull(),
  kind: text('kind', { enum: propertyKindEnum }).notNull().default('hotel'),
  categoryLabel: text('category_label', { length: 60 }).notNull().default('Hotel'),
  description: text('description'),
  /** The property's own website, e.g. spekehotel.com. */
  websiteUrl: text('website_url'),
  area: text('area', { length: 160 }),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: statusEnum }).notNull().default('published'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('properties_slug_idx').on(t.slug)]);

export const venues = sqliteTable('venues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug', { length: 120 }).notNull(),
  name: text('name', { length: 160 }).notNull(),
  location: text('location', { length: 160 }).notNull(),
  capacity: text('capacity', { length: 80 }),
  venueSize: text('venue_size', { length: 80 }),
  /** Capacity bracket used by the filter chips, e.g. s10 / s50 / s120 / s1000. */
  sizeTag: text('size_tag', { length: 20 }).notNull().default('s10'),
  description: text('description'),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: statusEnum }).notNull().default('published'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('venues_slug_idx').on(t.slug)]);

/** The grouped "complete venue index" block on the events page. */
export const venueGroups = sqliteTable('venue_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupName: text('group_name', { length: 160 }).notNull(),
  venueList: text('venue_list').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const restaurants = sqliteTable('restaurants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug', { length: 120 }).notNull(),
  name: text('name', { length: 160 }).notNull(),
  cuisine: text('cuisine', { length: 120 }),
  description: text('description'),
  /** 'restaurant' or 'bar' — same shape, two lists on the page. */
  kind: text('kind', { length: 20 }).notNull().default('restaurant'),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt', { length: 300 }),
  openingTimes: text('opening_times', { length: 200 }),
  dressCode: text('dress_code', { length: 120 }),
  phone: text('phone', { length: 60 }),
  email: text('email', { length: 160 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: statusEnum }).notNull().default('published'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('restaurants_slug_idx').on(t.slug)]);

export const experiences = sqliteTable('experiences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug', { length: 120 }).notNull(),
  name: text('name', { length: 160 }).notNull(),
  description: text('description'),
  /** Short bullet points shown under the description. */
  highlights: text('highlights'),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt', { length: 300 }),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: statusEnum }).notNull().default('published'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [uniqueIndex('experiences_slug_idx').on(t.slug)]);

export const newsPosts = sqliteTable('news_posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug', { length: 160 }).notNull(),
  title: text('title', { length: 250 }).notNull(),
  excerpt: text('excerpt'),
  body: text('body'),
  /** Free text so it can read "Kabira Country Club" or simply "Group". */
  propertyLabel: text('property_label', { length: 120 }).default('Group'),
  tag: text('tag', { length: 40 }).default('group'),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt', { length: 300 }),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  status: text('status', { enum: statusEnum }).notNull().default('draft'),
  authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [
  uniqueIndex('news_slug_idx').on(t.slug),
  index('news_published_idx').on(t.publishedAt),
]);

export const offers = sqliteTable('offers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 200 }).notNull(),
  propertyLabel: text('property_label', { length: 120 }),
  description: text('description'),
  /** accommodation | dining | events | spa — drives the homepage tabs. */
  category: text('category', { length: 40 }).notNull().default('accommodation'),
  imageUrl: text('image_url'),
  linkUrl: text('link_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: statusEnum }).notNull().default('published'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

export const milestones = sqliteTable('milestones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  year: text('year', { length: 20 }).notNull(),
  title: text('title', { length: 200 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

/** Small repeated blocks: "Why stay with us" tiles and "Occasions we host". */
export const highlightBlocks = sqliteTable('highlight_blocks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  section: text('section', { length: 40 }).notNull(), // pillars | occasions
  icon: text('icon', { length: 12 }),
  name: text('name', { length: 160 }).notNull(),
  description: text('description'),
  linkUrl: text('link_url'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [index('highlight_section_idx').on(t.section)]);

/* ============================================================
   Settings — headings, hero video, contact details, stats
   ============================================================ */

export const settings = sqliteTable('settings', {
  key: text('key', { length: 80 }).primaryKey(),
  value: text('value'),
  /** text | textarea | url | image | video | number — picks the editor field. */
  valueType: text('value_type', { length: 20 }).notNull().default('text'),
  label: text('label', { length: 160 }).notNull(),
  helpText: text('help_text'),
  group: text('group', { length: 60 }).notNull().default('general'),
  sortOrder: integer('sort_order').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [index('settings_group_idx').on(t.group)]);

/* ============================================================
   Enquiries — the contact form lands here for the marketing team
   ============================================================ */

export const enquiries = sqliteTable('enquiries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name', { length: 160 }).notNull(),
  email: text('email', { length: 255 }).notNull(),
  phone: text('phone', { length: 60 }),
  subject: text('subject', { length: 250 }),
  message: text('message').notNull(),
  kind: text('kind', { enum: enquiryKindEnum }).notNull().default('general'),
  status: text('status', { enum: enquiryStatusEnum }).notNull().default('new'),
  assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
  internalNote: text('internal_note'),
  /** Kept for spam triage, never shown on the public site. */
  sourcePage: text('source_page', { length: 160 }),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (t) => [
  index('enquiries_status_idx').on(t.status),
  index('enquiries_created_idx').on(t.createdAt),
]);

export type User = typeof users.$inferSelect;
export type Role = User['role'];
export type Enquiry = typeof enquiries.$inferSelect;
export type NewsPost = typeof newsPosts.$inferSelect;
export type Property = typeof properties.$inferSelect;
