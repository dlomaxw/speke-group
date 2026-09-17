import 'server-only';
import { cache } from 'react';
import { draftMode } from 'next/headers';
import { asc, desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  properties, venues, venueGroups, restaurants, experiences,
  newsPosts, offers, milestones, highlightBlocks, settings,
} from '@/db/schema';
import { getSession } from '@/lib/auth';
import { allPending, reviveSnapshot } from '@/lib/versions';

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
   Preview
   ------------------------------------------------------------------ */

/**
 * True when a signed-in staff member has switched preview on. Both checks are
 * needed: the draft-mode cookie alone never reveals unpublished content.
 */
export const isPreview = cache(async () => {
  const { isEnabled } = await draftMode();
  if (!isEnabled) return false;
  return Boolean(await getSession());
});

const pendingByCollection = cache(async () => {
  const rows = await allPending();
  const map = new Map<string, Map<number, Record<string, unknown>>>();
  for (const r of rows) {
    if (r.recordId == null) continue;
    if (!map.has(r.collection)) map.set(r.collection, new Map());
    // allPending is newest first; keep the newest proposal per record.
    if (!map.get(r.collection)!.has(r.recordId)) map.get(r.collection)!.set(r.recordId, reviveSnapshot(r.data));
  }
  return map;
});

/**
 * Published rows for visitors. In preview: every row, with waiting changes
 * laid over the live values, filtered and ordered the same way.
 */
async function visible<T extends { id: number; status?: string }>(
  collection: string,
  rows: T[],
  keep: (row: T) => boolean,
  order: (a: T, b: T) => number,
): Promise<T[]> {
  if (!(await isPreview())) return rows.filter((r) => r.status === undefined || r.status === PUBLISHED).filter(keep);
  const overlay = (await pendingByCollection()).get(collection);
  const merged = rows.map((r) => (overlay?.has(r.id) ? ({ ...r, ...overlay.get(r.id) } as T) : r));
  return merged.filter(keep).sort(order);
}

const bySort = (a: { sortOrder: number }, b: { sortOrder: number }) => a.sortOrder - b.sortOrder;

/* ------------------------------------------------------------------
   Content
   ------------------------------------------------------------------ */

export async function getProperties() {
  const db = await getDb();
  const rows = await db.select().from(properties).orderBy(asc(properties.sortOrder));
  return visible('properties', rows, () => true, bySort);
}

export async function getVenues() {
  const db = await getDb();
  const rows = await db.select().from(venues).orderBy(asc(venues.sortOrder));
  return visible('venues', rows, () => true, bySort);
}

export async function getVenueGroups() {
  const db = await getDb();
  return db.select().from(venueGroups).orderBy(asc(venueGroups.sortOrder));
}

export async function getDining(kind: 'restaurant' | 'bar') {
  const db = await getDb();
  const rows = await db.select().from(restaurants).orderBy(asc(restaurants.sortOrder));
  return visible('restaurants', rows, (r) => r.kind === kind, bySort);
}

export async function getExperiences() {
  const db = await getDb();
  const rows = await db.select().from(experiences).orderBy(asc(experiences.sortOrder));
  return visible('experiences', rows, () => true, bySort);
}

export async function getNews() {
  const db = await getDb();
  const rows = await db.select().from(newsPosts).orderBy(desc(newsPosts.publishedAt));
  const time = (d: Date | null) => (d ? d.getTime() : 0);
  return visible('news', rows, () => true, (a, b) => time(b.publishedAt) - time(a.publishedAt));
}

export async function getOffers() {
  const db = await getDb();
  const rows = await db.select().from(offers).orderBy(asc(offers.sortOrder));
  return visible('offers', rows, () => true, bySort);
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
