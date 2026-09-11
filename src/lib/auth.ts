import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, activityLog, type Role, type User } from '@/db/schema';
import { can, type Permission } from './rbac';

const COOKIE = 'speke_session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // a working day

function secret() {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    // A weak secret would make sessions forgeable, so fail loudly rather
    // than silently signing with something guessable.
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set to at least 32 characters.');
    }
    return new TextEncoder().encode('dev-only-insecure-secret-change-me-please');
  }
  return new TextEncoder().encode(raw);
}

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
};

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

async function issueSession(user: User) {
  const token = await new SignJWT({
    uid: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    mcp: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/** Returns null rather than throwing so layouts can decide what to do. */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    const id = Number(payload.uid);
    if (!id) return null;

    // Re-read the user each request: a deactivated account or a role change
    // must take effect immediately, not whenever the token happens to expire.
    const db = await getDb();
    const [fresh] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!fresh || !fresh.isActive) return null;

    return {
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      role: fresh.role,
      mustChangePassword: fresh.mustChangePassword,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect('/admin?denied=' + encodeURIComponent(permission));
  return user;
}

export async function signIn(email: string, password: string) {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);

  // Same message and a hash comparison either way, so the response does not
  // reveal whether an address is registered.
  const dummy = '$2a$12$0000000000000000000000000000000000000000000000000000';
  const ok = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyPassword(password, dummy).then(() => false);

  if (!user || !ok) return { ok: false as const, error: 'Email or password is incorrect.' };
  if (!user.isActive) return { ok: false as const, error: 'This account has been deactivated.' };

  await issueSession(user);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  return { ok: true as const, user };
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** Refreshes the cookie after a role or password change. */
export async function refreshSession(userId: number) {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user) await issueSession(user);
}

export async function logActivity(
  actor: SessionUser | null,
  action: string,
  entity: string,
  entityId?: string | number,
  summary?: string,
) {
  const db = await getDb();
  await db.insert(activityLog).values({
    userId: actor?.id ?? null,
    userEmail: actor?.email ?? null,
    action,
    entity,
    entityId: entityId != null ? String(entityId) : null,
    summary: summary ?? null,
  });
}
