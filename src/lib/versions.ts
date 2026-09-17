import 'server-only';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { contentVersions } from '@/db/schema';
import type { SessionUser } from './auth';

/**
 * Version history and pending changes.
 *
 * Every save writes the record's resulting state as a "history" version, and
 * a delete writes the state it had just before, so any earlier state can be
 * put back. Changes a non-publisher makes to published content are stored as
 * "pending" instead of being applied, until a publisher approves them.
 */

type Snapshot = Record<string, unknown>;

/** Dates become ISO strings in JSON; turn the known timestamp fields back into Dates. */
const DATE_FIELDS = new Set(['updatedAt', 'createdAt', 'publishedAt']);

export function reviveSnapshot(json: string): Snapshot {
  const raw = JSON.parse(json) as Snapshot;
  for (const k of Object.keys(raw)) {
    if (DATE_FIELDS.has(k) && typeof raw[k] === 'string') raw[k] = new Date(raw[k] as string);
  }
  return raw;
}

export async function recordHistory(
  user: SessionUser | null,
  collection: string,
  recordId: number | null,
  action: string,
  data: Snapshot,
  note?: string,
) {
  const db = await getDb();
  await db.insert(contentVersions).values({
    collection,
    recordId,
    action,
    state: 'history',
    data: JSON.stringify(data),
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    note: note ?? null,
  });
}

/**
 * Content that existed before history began has no saved version. The first
 * time such a record changes, keep its original state so it can be put back.
 */
export async function ensureBaseline(
  collection: string,
  recordId: number,
  current: Snapshot | null | undefined,
) {
  if (!current) return;
  const db = await getDb();
  const [any] = await db.select({ id: contentVersions.id }).from(contentVersions)
    .where(and(
      eq(contentVersions.collection, collection),
      eq(contentVersions.recordId, recordId),
      eq(contentVersions.state, 'history'),
    ))
    .limit(1);
  if (any) return;
  await db.insert(contentVersions).values({
    collection,
    recordId,
    action: 'original',
    state: 'history',
    data: JSON.stringify(current),
    note: 'as it was before version history started',
  });
}

/** Stores a proposed change, replacing any earlier proposal for the same record. */
export async function proposeChange(
  user: SessionUser,
  collection: string,
  recordId: number,
  data: Snapshot,
) {
  const db = await getDb();
  await db.update(contentVersions)
    .set({ state: 'superseded' })
    .where(and(
      eq(contentVersions.collection, collection),
      eq(contentVersions.recordId, recordId),
      eq(contentVersions.state, 'pending'),
    ));
  await db.insert(contentVersions).values({
    collection,
    recordId,
    action: 'proposed',
    state: 'pending',
    data: JSON.stringify(data),
    userId: user.id,
    userEmail: user.email,
  });
}

export async function listHistory(collection: string, recordId: number | null, limit = 30) {
  const db = await getDb();
  return db.select().from(contentVersions)
    .where(and(
      eq(contentVersions.collection, collection),
      // Site settings are one document, stored against record 0.
      eq(contentVersions.recordId, recordId ?? 0),
      inArray(contentVersions.state, ['history', 'approved', 'rejected', 'pending']),
    ))
    .orderBy(desc(contentVersions.id))
    .limit(limit);
}

export async function pendingFor(collection: string, recordId: number) {
  const db = await getDb();
  const [row] = await db.select().from(contentVersions)
    .where(and(
      eq(contentVersions.collection, collection),
      eq(contentVersions.recordId, recordId),
      eq(contentVersions.state, 'pending'),
    ))
    .orderBy(desc(contentVersions.id))
    .limit(1);
  return row ?? null;
}

export async function allPending() {
  const db = await getDb();
  return db.select().from(contentVersions)
    .where(eq(contentVersions.state, 'pending'))
    .orderBy(desc(contentVersions.id));
}

/** Field-by-field differences between two snapshots, ignoring bookkeeping fields. */
export function diff(before: Snapshot, after: Snapshot) {
  const skip = new Set(['id', 'updatedAt', 'createdAt']);
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out: { field: string; before: unknown; after: unknown }[] = [];
  for (const k of keys) {
    if (skip.has(k)) continue;
    const a = before[k] instanceof Date ? (before[k] as Date).toISOString() : before[k];
    const b = after[k] instanceof Date ? (after[k] as Date).toISOString() : after[k];
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) out.push({ field: k, before: a, after: b });
  }
  return out;
}
