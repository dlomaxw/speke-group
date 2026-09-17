'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { getDb, getDynamicDb } from '@/db';
import {
  users, media, settings, enquiries, contentVersions, userProperties, properties,
} from '@/db/schema';
import {
  checkPassword, completeSignIn, startMfaChallenge, getMfaChallenge,
  signOut as doSignOut, requireUser, getSession,
  hashPassword, verifyPassword, refreshSession, logActivity, type SessionUser,
} from '@/lib/auth';
import { assertCan, can } from '@/lib/rbac';
import { getCollection, type CollectionConfig, type Field } from '@/lib/collections';
import { uploadFile, deleteFile } from '@/lib/storage';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { createEnrolment, checkCode, verifyAndConsume, mfaRequiredFor } from '@/lib/mfa';
import { getAccess, covers, OUT_OF_SCOPE } from '@/lib/access';
import { recordHistory, proposeChange, reviveSnapshot, ensureBaseline } from '@/lib/versions';
import { processOutbox, retryEvents } from '@/lib/outbox';

type State = { error?: string; ok?: string };

/* ============================================================
   Sign in / out, with the authenticator step
   ============================================================ */

export async function signInAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const ip = clientIp(await headers());
  const limit = await rateLimit(`login:${ip}:${email}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return { error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minutes.` };
  }

  const result = await checkPassword(email, password);
  if (!result.ok) return { error: result.error };

  if (result.user.totpEnabledAt) {
    await startMfaChallenge(result.user);
    redirect('/admin/login/verify');
  }
  await completeSignIn(result.user);
  redirect('/admin');
}

export async function verifyMfaAction(_prev: State, formData: FormData): Promise<State> {
  const user = await getMfaChallenge();
  if (!user) return { error: 'That sign-in took too long. Start again with your password.' };

  const limit = await rateLimit(`mfa:${user.id}`, 6, 10 * 60 * 1000);
  if (!limit.ok) return { error: 'Too many wrong codes. Wait a few minutes and start again.' };

  const ok = await verifyAndConsume(user.id, String(formData.get('code') ?? ''));
  if (!ok) return { error: 'That code is not right, or it has already been used. Try the next one.' };

  await completeSignIn(user);
  redirect('/admin');
}

export async function signOutAction() {
  await doSignOut();
  redirect('/admin/login');
}

/* ============================================================
   Two-step sign-in enrolment
   ============================================================ */

export async function beginMfaEnrolment() {
  const user = await requireUser({ allowWithoutMfa: true });
  const { sealed, qrDataUrl, secretBase32 } = await createEnrolment(user.email);
  return { sealed, qrDataUrl, secretBase32 };
}

export async function confirmMfaEnrolment(sealed: string, code: string): Promise<State> {
  const user = await requireUser({ allowWithoutMfa: true });
  let step: number | null = null;
  try {
    step = checkCode(sealed, code, user.email);
  } catch {
    return { error: 'That setup has expired. Start again.' };
  }
  if (step === null) return { error: 'That code is not right. Check the time on your phone and try the next code.' };

  const db = await getDb();
  await db.update(users)
    .set({ totpSecret: sealed, totpEnabledAt: new Date(), totpLastStep: step, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await refreshSession(user.id);
  await logActivity(user, 'updated', 'users', user.id, 'turned on two-step sign-in');
  revalidatePath('/admin/account/security');
  return { ok: 'Two-step sign-in is on.' };
}

export async function disableOwnMfa(code: string): Promise<State> {
  const user = await requireUser();
  if (mfaRequiredFor(user.role)) return { error: 'Administrators must keep two-step sign-in on.' };
  if (!(await verifyAndConsume(user.id, code))) return { error: 'That code is not right.' };

  const db = await getDb();
  await db.update(users)
    .set({ totpSecret: null, totpEnabledAt: null, totpLastStep: null, updatedAt: new Date() })
    .where(eq(users.id, user.id));
  await logActivity(user, 'updated', 'users', user.id, 'turned off two-step sign-in');
  revalidatePath('/admin/account/security');
  return { ok: 'Two-step sign-in is off.' };
}

/** An administrator clears someone's authenticator, e.g. after a lost phone. */
export async function resetUserMfa(userId: number) {
  const actor = await requireUser();
  assertCan(actor.role, 'users.manage');
  if (actor.id === userId) throw new Error('Reset your own two-step sign-in from Your account.');

  const db = await getDb();
  const [target] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  await db.update(users)
    .set({ totpSecret: null, totpEnabledAt: null, totpLastStep: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  await logActivity(actor, 'updated', 'users', userId, `reset two-step sign-in for ${target?.email ?? userId}`);
  revalidatePath('/admin/users');
}

/* ============================================================
   Content — one save path for every collection
   ============================================================ */

function coerce(field: Field, raw: FormDataEntryValue | null) {
  if (field.type === 'checkbox') return raw === 'on' || raw === 'true';
  const value = raw == null ? '' : String(raw).trim();
  if (field.type === 'number') return value === '' ? 0 : Number(value);
  if (field.type === 'property') return value === '' ? null : Number(value);
  if (field.type === 'date') return value === '' ? null : new Date(value);
  return value === '' ? null : value;
}

const propertyOf = (config: CollectionConfig, record: Record<string, unknown> | null | undefined) =>
  !record || !config.propertyField ? null
    : (record[config.propertyField] as number | null | undefined) ?? null;

async function loadRecord(config: CollectionConfig, id: number) {
  const db = await getDynamicDb();
  const [row] = await db.select().from(config.table).where(eq(config.table.id, id)).limit(1);
  return (row as Record<string, unknown> | undefined) ?? null;
}

/** Throws unless the user may change a record owned by this property. */
async function assertCovers(user: SessionUser, config: CollectionConfig, propertyId: number | null) {
  const access = await getAccess(user);
  if (access.all) return;
  if (!config.propertyField) throw new Error('Only staff covering every property can change group-wide content.');
  if (!covers(access, propertyId)) throw new Error(OUT_OF_SCOPE);
}

/** Media from the library may only go on the site once its rights are approved. */
async function assertMediaApproved(config: CollectionConfig, values: Record<string, unknown>) {
  const urls = config.fields
    .filter((f) => f.type === 'image')
    .map((f) => values[f.name])
    .filter((v): v is string => typeof v === 'string' && v !== '');
  if (urls.length === 0) return;
  const db = await getDb();
  const rows = await db.select({ url: media.url, rightsStatus: media.rightsStatus, filename: media.filename })
    .from(media).where(inArray(media.url, urls));
  const blocked = rows.find((r) => r.rightsStatus !== 'approved');
  if (blocked) {
    throw new Error(`"${blocked.filename}" has not had its usage rights approved yet, so it cannot go on the site.`);
  }
}

function revalidateContent(slug: string) {
  revalidatePath('/admin/' + slug);
  revalidatePath('/admin/review');
  revalidatePath('/', 'layout');
}

export async function saveRecord(collectionSlug: string, formData: FormData): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'content.edit');

  const config = getCollection(collectionSlug);
  if (!config) return { error: 'Unknown content type.' };

  const idRaw = formData.get('id');
  const id = idRaw ? Number(idRaw) : null;
  const mayPublish = can(user.role, 'content.publish');

  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.listOnly) continue;
    if (!formData.has(field.name) && field.type !== 'checkbox') continue;
    // Publishing is gated: marketing may edit but cannot flip status.
    if (field.name === 'status' && !mayPublish) continue;

    const v = coerce(field, formData.get(field.name));
    if (field.required && (v === null || v === '')) return { error: `${field.label} is required.` };
    values[field.name] = v;
  }

  try {
    const existing = id ? await loadRecord(config, id) : null;
    if (id && !existing) return { error: 'That item no longer exists.' };

    // Both the current owner and the new owner must be within reach.
    await assertCovers(user, config, propertyOf(config, existing));
    if (config.propertyField === 'propertyId') await assertCovers(user, config, (values.propertyId as number | null) ?? null);
    await assertMediaApproved(config, values);

    if (config.hasStatus && !mayPublish && !existing) values.status = 'draft';
    values.updatedAt = new Date();

    const db = await getDynamicDb();
    const table = config.table;
    const label = String(values.name ?? values.title ?? existing?.name ?? existing?.title ?? '');

    if (existing && config.hasStatus && existing.status === 'published' && !mayPublish) {
      // Published content changes only after a publisher approves.
      await proposeChange(user, config.slug, id!, { ...existing, ...values });
      await logActivity(user, 'proposed', config.slug, id!, label);
      revalidateContent(config.slug);
      return { ok: 'Sent for approval. The live site changes once a manager approves it.' };
    }

    if (existing) {
      await ensureBaseline(config.slug, id!, existing);
      const [row] = await db.update(table).set(values).where(eq(table.id, id)).returning();
      await recordHistory(user, config.slug, id, 'updated', row);
      await logActivity(user, 'updated', config.slug, id!, label);
    } else {
      const [row] = await db.insert(table).values(values).returning();
      await recordHistory(user, config.slug, row.id, 'created', row);
      await logActivity(user, 'created', config.slug, row?.id, label);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not save.';
    if (message.includes('UNIQUE constraint failed') || message.includes('duplicate key')) {
      return { error: 'That slug is already used. Pick another.' };
    }
    return { error: message };
  }

  revalidateContent(config.slug);
  return { ok: 'Saved.' };
}

export async function deleteRecord(collectionSlug: string, id: number) {
  const user = await requireUser();
  assertCan(user.role, 'content.delete');

  const config = getCollection(collectionSlug);
  if (!config) throw new Error('Unknown content type.');

  const existing = await loadRecord(config, id);
  if (!existing) return;
  await assertCovers(user, config, propertyOf(config, existing));

  await ensureBaseline(config.slug, id, existing);
  const db = await getDynamicDb();
  try {
    await db.delete(config.table).where(eq(config.table.id, id));
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.includes('FOREIGN KEY')) {
      throw new Error('Other content still points at this property. Move or delete that first.');
    }
    throw e;
  }
  // Keep the last state so the deletion can be undone.
  await recordHistory(user, config.slug, id, 'deleted', existing);
  await logActivity(user, 'deleted', config.slug, id, String(existing.name ?? existing.title ?? ''));
  revalidateContent(config.slug);
}

export async function setStatus(collectionSlug: string, id: number, status: 'draft' | 'published') {
  const user = await requireUser();
  assertCan(user.role, 'content.publish');

  const config = getCollection(collectionSlug);
  if (!config?.hasStatus) throw new Error('That content type has no publish state.');

  const existing = await loadRecord(config, id);
  if (!existing) throw new Error('That item no longer exists.');
  await assertCovers(user, config, propertyOf(config, existing));

  const patch: Record<string, unknown> = { status, updatedAt: new Date() };
  if (collectionSlug === 'news' && status === 'published' && !existing.publishedAt) patch.publishedAt = new Date();

  await ensureBaseline(config.slug, id, existing);
  const db = await getDynamicDb();
  const [row] = await db.update(config.table).set(patch).where(eq(config.table.id, id)).returning();
  await recordHistory(user, config.slug, id, status === 'published' ? 'published' : 'unpublished', row);
  await logActivity(user, status === 'published' ? 'published' : 'unpublished', config.slug, id);
  revalidateContent(config.slug);
}

/* ============================================================
   Version history, restore, and approval of pending changes
   ============================================================ */

/** Puts a record (or the site settings) back to a saved version. */
export async function restoreVersion(versionId: number): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'content.publish');

  const db = await getDb();
  const [version] = await db.select().from(contentVersions).where(eq(contentVersions.id, versionId)).limit(1);
  if (!version) return { error: 'That version no longer exists.' };
  const snapshot = reviveSnapshot(version.data);

  if (version.collection === 'settings') {
    assertCan(user.role, 'settings.edit');
    for (const [key, value] of Object.entries(snapshot)) {
      await db.update(settings).set({ value: value == null ? null : String(value), updatedAt: new Date() })
        .where(eq(settings.key, key));
    }
    await recordHistory(user, 'settings', 0, 'restored', snapshot, `from version ${version.id}`);
    await logActivity(user, 'restored', 'settings', undefined, `version ${version.id}`);
    revalidatePath('/admin/settings');
    revalidatePath('/', 'layout');
    return { ok: 'Settings restored.' };
  }

  const config = getCollection(version.collection);
  if (!config || version.recordId == null) return { error: 'Unknown content type.' };
  await assertCovers(user, config, propertyOf(config, snapshot));

  const dyn = await getDynamicDb();
  const current = await loadRecord(config, version.recordId);
  const values: Record<string, unknown> = { ...snapshot, updatedAt: new Date() };
  try {
    if (current) {
      const { id: _id, ...rest } = values;
      void _id;
      await dyn.update(config.table).set(rest).where(eq(config.table.id, version.recordId));
    } else {
      await dyn.insert(config.table).values({ ...values, id: version.recordId });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not restore.';
    if (message.includes('UNIQUE constraint failed')) {
      return { error: 'Another item now uses the same slug. Change that one first, then restore.' };
    }
    return { error: message };
  }
  const restored = await loadRecord(config, version.recordId);
  await recordHistory(user, config.slug, version.recordId, 'restored', restored ?? values, `from version ${version.id}`);
  await logActivity(user, 'restored', config.slug, version.recordId, `version ${version.id}`);
  revalidateContent(config.slug);
  return { ok: 'Restored.' };
}

export async function approveChange(versionId: number): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'content.publish');

  const db = await getDb();
  const [version] = await db.select().from(contentVersions).where(eq(contentVersions.id, versionId)).limit(1);
  if (!version || version.state !== 'pending') return { error: 'That change has already been dealt with.' };
  const config = getCollection(version.collection);
  if (!config || version.recordId == null) return { error: 'Unknown content type.' };

  const proposed = reviveSnapshot(version.data);
  try {
    await assertCovers(user, config, propertyOf(config, proposed));
    await assertMediaApproved(config, proposed);
    const { id: _id, ...rest } = proposed;
    void _id;
    const dyn = await getDynamicDb();
    const [live] = await dyn.select().from(config.table).where(eq(config.table.id, version.recordId)).limit(1);
    await ensureBaseline(config.slug, version.recordId, live);
    const [row] = await dyn.update(config.table).set({ ...rest, updatedAt: new Date() })
      .where(eq(config.table.id, version.recordId)).returning();
    if (!row) return { error: 'The item was deleted after this change was proposed.' };
    await db.update(contentVersions)
      .set({ state: 'approved', reviewedBy: user.id, reviewedAt: new Date() })
      .where(eq(contentVersions.id, versionId));
    await recordHistory(user, config.slug, version.recordId, 'approved', row, `proposed by ${version.userEmail ?? 'unknown'}`);
    await logActivity(user, 'approved', config.slug, version.recordId, `change ${versionId}`);
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not approve.' };
  }
  revalidateContent(config.slug);
  return { ok: 'Approved and live.' };
}

export async function rejectChange(versionId: number, note: string): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'content.publish');
  const db = await getDb();
  const res = await db.update(contentVersions)
    .set({ state: 'rejected', reviewedBy: user.id, reviewedAt: new Date(), note: note.slice(0, 500) || null })
    .where(and(eq(contentVersions.id, versionId), eq(contentVersions.state, 'pending')))
    .returning({ collection: contentVersions.collection, recordId: contentVersions.recordId });
  if (res.length === 0) return { error: 'That change has already been dealt with.' };
  await logActivity(user, 'rejected', res[0].collection, res[0].recordId ?? undefined, note.slice(0, 120));
  revalidatePath('/admin/review');
  return { ok: 'Change rejected.' };
}

/* ============================================================
   Media
   ============================================================ */

export async function uploadMedia(_prev: State, formData: FormData): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'media.upload');

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file first.' };

  try {
    const folder = String(formData.get('folder') ?? 'general');
    const result = await uploadFile(file, folder);
    const db = await getDb();
    await db.insert(media).values({
      url: result.url,
      pathname: result.pathname,
      filename: file.name,
      contentType: result.contentType,
      bytes: result.bytes,
      alt: String(formData.get('alt') ?? '') || null,
      credit: String(formData.get('credit') ?? '') || null,
      folder,
      uploadedBy: user.id,
    });
    await logActivity(user, 'created', 'media', undefined, file.name);
    revalidatePath('/admin/media');
    return { ok: `Uploaded ${file.name}. A manager needs to approve its usage rights before it can go on the site.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed.' };
  }
}

export async function reviewMediaRights(id: number, status: 'approved' | 'rejected', note: string) {
  const user = await requireUser();
  assertCan(user.role, 'media.approve');
  const db = await getDb();
  await db.update(media)
    .set({ rightsStatus: status, rightsNote: note.slice(0, 500) || null, rightsReviewedBy: user.id, rightsReviewedAt: new Date() })
    .where(eq(media.id, id));
  await logActivity(user, status === 'approved' ? 'approved' : 'rejected', 'media', id, 'usage rights');
  revalidatePath('/admin/media');
}

export async function deleteMedia(id: number) {
  const user = await requireUser();
  assertCan(user.role, 'media.delete');

  const db = await getDb();
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (row?.pathname) await deleteFile(row.pathname);
  await db.delete(media).where(eq(media.id, id));
  await logActivity(user, 'deleted', 'media', id, row?.filename);
  revalidatePath('/admin/media');
}

/* ============================================================
   Settings
   ============================================================ */

export async function saveSettings(_prev: State, formData: FormData): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'settings.edit');

  const db = await getDb();
  const before = await db.select({ key: settings.key, value: settings.value }).from(settings);
  await ensureBaseline('settings', 0, Object.fromEntries(before.map((s) => [s.key, s.value])));
  let changed = 0;
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('setting__')) continue;
    const realKey = key.slice('setting__'.length);
    await db.update(settings)
      .set({ value: String(value), updatedAt: new Date() })
      .where(eq(settings.key, realKey));
    changed++;
  }
  const all = await db.select({ key: settings.key, value: settings.value }).from(settings);
  await recordHistory(user, 'settings', 0, 'updated', Object.fromEntries(all.map((s) => [s.key, s.value])));
  await logActivity(user, 'updated', 'settings', undefined, `${changed} settings`);
  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: `Saved ${changed} setting${changed === 1 ? '' : 's'}.` };
}

/* ============================================================
   Enquiries
   ============================================================ */

type Stage = 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'spam';
const REPLIED_STAGES: Stage[] = ['contacted', 'qualified', 'converted', 'lost'];
const CLOSED_STAGES: Stage[] = ['converted', 'lost', 'spam'];

async function loadEnquiryInScope(user: SessionUser, id: number) {
  const db = await getDb();
  const [row] = await db.select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  if (!row) throw new Error('That enquiry no longer exists.');
  if (!covers(await getAccess(user), row.propertyId)) throw new Error(OUT_OF_SCOPE);
  return row;
}

export async function updateEnquiry(id: number, patch: {
  status?: Stage;
  assignedTo?: number | null;
  internalNote?: string;
  conversionReference?: string;
  markReplied?: boolean;
}) {
  const user = await requireUser();
  assertCan(user.role, 'enquiries.manage');
  const row = await loadEnquiryInScope(user, id);

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.assignedTo !== undefined) set.assignedTo = patch.assignedTo;
  if (patch.internalNote !== undefined) set.internalNote = patch.internalNote.slice(0, 4000);
  if (patch.conversionReference !== undefined) set.conversionReference = patch.conversionReference.trim().slice(0, 120) || null;

  if (patch.status) {
    if (patch.status === 'converted') {
      const ref = (patch.conversionReference ?? row.conversionReference ?? '').trim();
      if (!ref) throw new Error('Add the booking reference (or other agreed evidence) before marking this converted.');
    }
    set.status = patch.status;
    if (CLOSED_STAGES.includes(patch.status)) set.closedAt = row.closedAt ?? new Date();
    else set.closedAt = null;
    if (REPLIED_STAGES.includes(patch.status) && !row.firstHumanReplyAt) set.firstHumanReplyAt = new Date();
  }
  // A staff member confirms they replied; automated messages never count.
  if (patch.markReplied && !row.firstHumanReplyAt) set.firstHumanReplyAt = new Date();

  const db = await getDb();
  await db.update(enquiries).set(set).where(eq(enquiries.id, id));
  await logActivity(user, 'updated', 'enquiries', id, patch.status ?? (patch.markReplied ? 'marked replied' : undefined));
  revalidatePath('/admin/enquiries');
}

export async function deleteEnquiry(id: number) {
  const user = await requireUser();
  assertCan(user.role, 'enquiries.delete');
  await loadEnquiryInScope(user, id);
  const db = await getDb();
  await db.delete(enquiries).where(eq(enquiries.id, id));
  await logActivity(user, 'deleted', 'enquiries', id);
  revalidatePath('/admin/enquiries');
}

export async function retryAlerts(ids: number[]): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'enquiries.manage');
  await retryEvents(ids);
  const result = await processOutbox(20);
  await logActivity(user, 'updated', 'enquiries', undefined, `retried ${ids.length} staff alert(s)`);
  revalidatePath('/admin/enquiries');
  if (!result.configured) return { error: 'Email sending is not set up yet, so alerts stay queued.' };
  return { ok: `Sent ${result.sent}. ${result.failed ? `${result.failed} still failing.` : ''}`.trim() };
}

/* ============================================================
   Users
   ============================================================ */

export async function saveUser(_prev: State, formData: FormData): Promise<State> {
  const actor = await requireUser();
  assertCan(actor.role, 'users.manage');

  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const role = String(formData.get('role') ?? 'viewer') as 'admin' | 'manager' | 'marketing' | 'viewer';
  const department = String(formData.get('department') ?? '').trim() || null;
  const isActive = formData.get('isActive') === 'on';
  const password = String(formData.get('password') ?? '');
  const propertyScope = formData.get('propertyScope') === 'assigned' ? 'assigned' : 'all';
  const propertyIds = formData.getAll('propertyIds').map(Number).filter(Number.isInteger);

  if (!email.includes('@')) return { error: 'Enter a valid email address.' };
  if (!name) return { error: 'Enter a name.' };
  if (propertyScope === 'assigned' && (role === 'admin' || role === 'manager')) {
    return { error: 'Administrators and general managers always cover every property.' };
  }
  if (propertyScope === 'assigned' && propertyIds.length === 0) {
    return { error: 'Pick at least one property, or allow all properties.' };
  }

  const db = await getDb();
  let userId = id;
  try {
    if (id) {
      if (actor.id === id && role !== 'admin') {
        return { error: 'You cannot remove your own administrator access.' };
      }
      const patch: Record<string, unknown> = { email, name, role, department, isActive, propertyScope, updatedAt: new Date() };
      if (password) {
        if (password.length < 10) return { error: 'Set a password of at least 10 characters.' };
        patch.passwordHash = await hashPassword(password);
        patch.mustChangePassword = true;
      }
      await db.update(users).set(patch as never).where(eq(users.id, id));
      await logActivity(actor, 'updated', 'users', id, email);
    } else {
      if (password.length < 10) return { error: 'Set a password of at least 10 characters.' };
      const [row] = await db.insert(users).values({
        email, name, role, department, isActive, propertyScope,
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
      }).returning({ id: users.id });
      userId = row.id;
      await logActivity(actor, 'created', 'users', row.id, email);
    }

    await db.delete(userProperties).where(eq(userProperties.userId, userId!));
    if (propertyScope === 'assigned') {
      const valid = await db.select({ id: properties.id }).from(properties).where(inArray(properties.id, propertyIds));
      for (const p of valid) await db.insert(userProperties).values({ userId: userId!, propertyId: p.id });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not save.';
    if (msg.includes('UNIQUE constraint failed') || msg.includes('duplicate key')) return { error: 'That email address already has an account.' };
    return { error: msg };
  }

  revalidatePath('/admin/users');
  return { ok: 'Saved.' };
}

export async function deleteUser(id: number) {
  const actor = await requireUser();
  assertCan(actor.role, 'users.manage');
  if (actor.id === id) throw new Error('You cannot delete your own account.');

  const db = await getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, 'admin'));
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (target?.role === 'admin' && Number(count) <= 1) {
    throw new Error('This is the only administrator account. Promote someone else first.');
  }

  await db.delete(users).where(eq(users.id, id));
  await logActivity(actor, 'deleted', 'users', id, target?.email);
  revalidatePath('/admin/users');
}

/** Any signed-in user changing their own password. */
export async function changeOwnPassword(_prev: State, formData: FormData): Promise<State> {
  const session = await getSession();
  if (!session) return { error: 'Your session has expired. Sign in again.' };

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (next.length < 10) return { error: 'Use at least 10 characters.' };
  if (next !== confirm) return { error: 'The two new passwords do not match.' };

  const db = await getDb();
  const [row] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return { error: 'Your current password is not correct.' };
  }

  await db.update(users)
    .set({ passwordHash: await hashPassword(next), mustChangePassword: false, updatedAt: new Date() })
    .where(eq(users.id, session.id));
  await refreshSession(session.id);
  await logActivity(session, 'updated', 'users', session.id, 'changed own password');
  return { ok: 'Password updated.' };
}
