import 'server-only';
import { asc, desc, eq, and } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  properties, venues, venueGroups, restaurants, experiences,
  newsPosts, offers, milestones, highlightBlocks, settings,
} from '@/db/schema';

/**
 * Everything the public pages read. One module so a page never reaches into
 * the database directly, and so "published only" is enforced in one place
 * rather than remembered at each call site.
 */

const PUBLISHED = 'published' as const;

/* ------------------------------------------------------------------
   Settings
   ------------------------------------------------------------------ */

export type SettingsMap = Record<string, string>;

export async function getSettings(): Promise<SettingsMap> {
  const db = await getDb();
  const rows = await db.select().from(settings);
  const map: SettingsMap = {};
  for (const r of rows) map[r.key] = r.value ?? '';
  return map;
}

/** Reads a setting with a fallback, so a missing row never blanks the page. */
export function setting(s: SettingsMap, key: string, fallback = ''): string {
  const v = s[key];
  return v == null || v === '' ? fallback : v;
}

/* ------------------------------------------------------------------
   Content
   ------------------------------------------------------------------ */

export async function getProperties() {
  const db = await getDb();
  return db.select().from(properties)
    .where(eq(properties.status, PUBLISHED))
    .orderBy(asc(properties.sortOrder));
}

export async function getVenues() {
  const db = await getDb();
  return db.select().from(venues)
    .where(eq(venues.status, PUBLISHED))
    .orderBy(asc(venues.sortOrder));
}

export async function getVenueGroups() {
  const db = await getDb();
  return db.select().from(venueGroups).orderBy(asc(venueGroups.sortOrder));
}

export async function getDining(kind: 'restaurant' | 'bar') {
  const db = await getDb();
  return db.select().from(restaurants)
    .where(and(eq(restaurants.status, PUBLISHED), eq(restaurants.kind, kind)))
    .orderBy(asc(restaurants.sortOrder));
}

export async function getExperiences() {
  const db = await getDb();
  return db.select().from(experiences)
    .where(eq(experiences.status, PUBLISHED))
    .orderBy(asc(experiences.sortOrder));
}

export async function getNews() {
  const db = await getDb();
  return db.select().from(newsPosts)
    .where(eq(newsPosts.status, PUBLISHED))
    .orderBy(desc(newsPosts.publishedAt));
}

export async function getOffers() {
  const db = await getDb();
  return db.select().from(offers)
    .where(eq(offers.status, PUBLISHED))
    .orderBy(asc(offers.sortOrder));
}

export async function getMilestones() {
  const db = await getDb();
  return db.select().from(milestones).orderBy(asc(milestones.sortOrder));
}

export async function getHighlights(section: 'pillars' | 'occasions') {
  const db = await getDb();
  return db.select().from(highlightBlocks)
    .where(eq(highlightBlocks.section, section))
    .orderBy(asc(highlightBlocks.sortOrder));
}

/* ------------------------------------------------------------------
   Shapes the header and footer need on every page
   ------------------------------------------------------------------ */

export type NavProperty = { name: string; url: string; kind: string };

export async function getChrome() {
  const [s, props] = await Promise.all([getSettings(), getProperties()]);

  const byKind = (kind: string): NavProperty[] =>
    props
      .filter((p) => p.kind === kind)
      .map((p) => ({
        name: p.name,
        kind: p.kind,
        url: p.websiteUrl || `https://spekegroup.com/${p.slug}/`,
      }));

  return {
    settings: s,
    hotels: byKind('hotel'),
    resorts: [...byKind('resort'), ...byKind('convention')],
    apartments: byKind('apartment'),
    allProperties: props,
  };
}

/** Splits "Fishing · Boat trips" into its parts. */
export function splitHighlights(value: string | null): string[] {
  if (!value) return [];
  return value.split('·').map((s) => s.trim()).filter(Boolean);
}
