import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, activityLog, type Role, type User } from '@/db/schema';
import { can, type Permission } from './rbac';
import { mfaRequiredFor } from './mfa';

const COOKIE = 'speke_session';
/** Set between a correct password and a correct authenticator code. */
const MFA_COOKIE = 'speke_mfa_pending';
const MFA_MAX_AGE_SECONDS = 5 * 60;
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
  totpEnabled: boolean;
  propertyScope: 'all' | 'assigned';
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
      totpEnabled: Boolean(fresh.totpEnabledAt),
      propertyScope: fresh.propertyScope,
    };
  } catch {
    return null;
  }
}

/**
 * The signed-in user, or a redirect to sign in. Administrators without
 * two-step sign-in set up are sent to set it up before anything else; only
 * the enrolment screen and its actions pass allowWithoutMfa.
 */
export async function requireUser(opts: { allowWithoutMfa?: boolean } = {}): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect('/admin/login');
  if (!opts.allowWithoutMfa && mfaRequiredFor(user.role) && !user.totpEnabled) {
    redirect('/admin/account/security?required=1');
  }
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) redirect('/admin?denied=' + encodeURIComponent(permission));
  return user;
}

/** Checks the password only; the caller decides whether a code is needed next. */
export async function checkPassword(email: string, password: string) {
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
  return { ok: true as const, user };
}

/** Issues the full session once every required sign-in step has passed. */
export async function completeSignIn(user: User) {
  const db = await getDb();
  await issueSession(user);
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  const jar = await cookies();
  jar.delete(MFA_COOKIE);
}

/** Remembers, for five minutes, that this browser gave a correct password. */
export async function startMfaChallenge(user: User) {
  const token = await new SignJWT({ uid: user.id, stage: 'mfa' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MFA_MAX_AGE_SECONDS}s`)
    .sign(secret());
  const jar = await cookies();
  jar.set(MFA_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/admin',
    maxAge: MFA_MAX_AGE_SECONDS,
  });
}

/** The user waiting for their authenticator code, if the challenge is still valid. */
export async function getMfaChallenge(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(MFA_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.stage !== 'mfa') return null;
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, Number(payload.uid))).limit(1);
    return user && user.isActive ? user : null;
  } catch {
    return null;
  }
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
  jar.delete(MFA_COOKIE);
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
