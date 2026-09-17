import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { userProperties } from '@/db/schema';
import type { SessionUser } from './auth';

/**
 * Which properties a person may work on.
 *
 * Administrators and general managers always cover every property. Anyone
 * else set to "assigned" covers only the properties linked to them, and may
 * not touch group-wide content (records with no property).
 */
export type Access = { all: true } | { all: false; propertyIds: Set<number> };

export async function getAccess(user: SessionUser): Promise<Access> {
  if (user.role === 'admin' || user.role === 'manager' || user.propertyScope === 'all') {
    return { all: true };
  }
  const db = await getDb();
  const rows = await db
    .select({ propertyId: userProperties.propertyId })
    .from(userProperties)
    .where(eq(userProperties.userId, user.id));
  return { all: false, propertyIds: new Set(rows.map((r) => r.propertyId)) };
}

/** Whether a record owned by `propertyId` (null = group-wide) is within reach. */
export function covers(access: Access, propertyId: number | null | undefined) {
  if (access.all) return true;
  return propertyId != null && access.propertyIds.has(Number(propertyId));
}

export const OUT_OF_SCOPE =
  'This belongs to a property you are not assigned to. Ask an administrator if you need access.';
