'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, sql } from 'drizzle-orm';
import { getDb, getDynamicDb } from '@/db';
import {
  users, media, settings, enquiries,
} from '@/db/schema';
import {
  signIn as doSignIn, signOut as doSignOut, requireUser, getSession,
  hashPassword, verifyPassword, refreshSession, logActivity,
} from '@/lib/auth';
import { assertCan, can } from '@/lib/rbac';
import { getCollection, type Field } from '@/lib/collections';
import { uploadFile, deleteFile } from '@/lib/storage';

type State = { error?: string; ok?: string };

/* ============================================================
   Sign in / out
   ============================================================ */

export async function signInAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const result = await doSignIn(email, password);
  if (!result.ok) return { error: result.error };
  redirect('/admin');
}

export async function signOutAction() {
  await doSignOut();
  redirect('/admin/login');
}

/* ============================================================
   Content — one save path for every collection
   ============================================================ */

function coerce(field: Field, raw: FormDataEntryValue | null) {
  if (field.type === 'checkbox') return raw === 'on' || raw === 'true';
  const value = raw == null ? '' : String(raw).trim();
  if (field.type === 'number') return value === '' ? 0 : Number(value);
  if (field.type === 'date') return value === '' ? null : new Date(value);
  return value === '' ? null : value;
}

export async function saveRecord(collectionSlug: string, formData: FormData): Promise<State> {
  const user = await requireUser();
  assertCan(user.role, 'content.edit');

  const config = getCollection(collectionSlug);
  if (!config) return { error: 'Unknown content type.' };

  const idRaw = formData.get('id');
  const id = idRaw ? Number(idRaw) : null;

  const values: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.listOnly) continue;
    if (!formData.has(field.name) && field.type !== 'checkbox') continue;

    // Publishing is gated: marketing may edit freely but cannot flip status.
    if (field.name === 'status' && !can(user.role, 'content.publish')) continue;

    const v = coerce(field, formData.get(field.name));
    if (field.required && (v === null || v === '')) {
      return { error: `${field.label} is required.` };
    }
    values[field.name] = v;
  }

  if (config.hasStatus && !can(user.role, 'content.publish') && id === null) {
    values.status = 'draft';   // new items from marketing start as drafts
  }
  values.updatedAt = new Date();

  const db = await getDynamicDb();
  const table = config.table;

  try {
    if (id) {
      await db.update(table).set(values).where(eq(table.id, id));
      await logActivity(user, 'updated', config.slug, id, String(values.name ?? values.title ?? ''));
    } else {
      const [row] = await db.insert(table).values(values).returning();
      await logActivity(user, 'created', config.slug, row?.id, String(values.name ?? values.title ?? ''));
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not save.';
    if (message.includes('UNIQUE constraint failed') || message.includes('duplicate key')) return { error: 'That slug is already used. Pick another.' };
    return { error: message };
  }

  revalidatePath('/admin/' + config.slug);
  revalidatePath('/');
  return { ok: 'Saved.' };
}

export async function deleteRecord(collectionSlug: string, id: number) {
  const user = await requireUser();
  assertCan(user.role, 'content.delete');

  const config = getCollection(collectionSlug);
  if (!config) throw new Error('Unknown content type.');

  const db = await getDynamicDb();
  const table = config.table;
  await db.delete(table).where(eq(table.id, id));
  await logActivity(user, 'deleted', config.slug, id);

  revalidatePath('/admin/' + config.slug);
  revalidatePath('/');
}

export async function setStatus(collectionSlug: string, id: number, status: 'draft' | 'published') {
  const user = await requireUser();
  assertCan(user.role, 'content.publish');

  const config = getCollection(collectionSlug);
  if (!config?.hasStatus) throw new Error('That content type has no publish state.');

  const db = await getDynamicDb();
  const table = config.table;
  const patch: Record<string, unknown> = { status, updatedAt: new Date() };
  if (collectionSlug === 'news' && status === 'published') patch.publishedAt = new Date();

  await db.update(table).set(patch).where(eq(table.id, id));
  await logActivity(user, status === 'published' ? 'published' : 'unpublished', config.slug, id);

  revalidatePath('/admin/' + config.slug);
  revalidatePath('/');
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
      folder,
      uploadedBy: user.id,
    });
    await logActivity(user, 'created', 'media', undefined, file.name);
    revalidatePath('/admin/media');
    return { ok: `Uploaded ${file.name}.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Upload failed.' };
  }
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
  let changed = 0;
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('setting__')) continue;
    const realKey = key.slice('setting__'.length);
    await db.update(settings)
      .set({ value: String(value), updatedAt: new Date() })
      .where(eq(settings.key, realKey));
    changed++;
  }
  await logActivity(user, 'updated', 'settings', undefined, `${changed} settings`);
  revalidatePath('/admin/settings');
  revalidatePath('/');
  return { ok: `Saved ${changed} setting${changed === 1 ? '' : 's'}.` };
}

/* ============================================================
   Enquiries
   ============================================================ */

export async function updateEnquiry(id: number, patch: {
  status?: 'new' | 'assigned' | 'answered' | 'closed' | 'spam';
  assignedTo?: number | null;
  internalNote?: string;
}) {
  const user = await requireUser();
  assertCan(user.role, 'enquiries.manage');

  const db = await getDb();
  await db.update(enquiries)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(enquiries.id, id));
  await logActivity(user, 'updated', 'enquiries', id, patch.status);
  revalidatePath('/admin/enquiries');
}

export async function deleteEnquiry(id: number) {
  const user = await requireUser();
  assertCan(user.role, 'enquiries.delete');
  const db = await getDb();
  await db.delete(enquiries).where(eq(enquiries.id, id));
  await logActivity(user, 'deleted', 'enquiries', id);
  revalidatePath('/admin/enquiries');
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

  if (!email.includes('@')) return { error: 'Enter a valid email address.' };
  if (!name) return { error: 'Enter a name.' };

  const db = await getDb();
  try {
    if (id) {
      // Never let the last administrator lock everyone out of the dashboard.
      if (actor.id === id && role !== 'admin') {
        return { error: 'You cannot remove your own administrator access.' };
      }
      const patch: Record<string, unknown> = { email, name, role, department, isActive, updatedAt: new Date() };
      if (password) {
        patch.passwordHash = await hashPassword(password);
        patch.mustChangePassword = true;
      }
      await db.update(users).set(patch as never).where(eq(users.id, id));
      await logActivity(actor, 'updated', 'users', id, email);
    } else {
      if (password.length < 10) return { error: 'Set a password of at least 10 characters.' };
      await db.insert(users).values({
        email, name, role, department, isActive,
        passwordHash: await hashPassword(password),
        mustChangePassword: true,
      });
      await logActivity(actor, 'created', 'users', undefined, email);
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
