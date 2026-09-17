import 'server-only';
import { Secret, TOTP } from 'otpauth';
import QRCode from 'qrcode';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { seal, open } from './secret-box';

const PURPOSE = 'totp';
const PERIOD = 30;

function totp(secretBase32: string, label: string) {
  return new TOTP({
    issuer: 'Speke Group Dashboard',
    label,
    algorithm: 'SHA1',
    digits: 6,
    period: PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });
}

/** A fresh secret plus the QR code an authenticator app scans. Nothing is saved yet. */
export async function createEnrolment(email: string) {
  const secret = new Secret({ size: 20 });
  const uri = totp(secret.base32, email).toString();
  const qrDataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { secretBase32: secret.base32, sealed: seal(secret.base32, PURPOSE), qrDataUrl };
}

/**
 * Checks a 6-digit code against the sealed secret, allowing one step of clock
 * drift either way. Returns the matched step so the caller can refuse a
 * replay of the same code.
 */
export function checkCode(sealedSecret: string, code: string, email: string): number | null {
  const clean = code.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return null;
  const secretBase32 = open(sealedSecret, PURPOSE);
  const delta = totp(secretBase32, email).validate({ token: clean, window: 1 });
  if (delta === null) return null;
  return Math.floor(Date.now() / 1000 / PERIOD) + delta;
}

/** Verifies and records the step in one go; a code already used is rejected. */
export async function verifyAndConsume(userId: number, code: string): Promise<boolean> {
  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.totpSecret || !user.totpEnabledAt) return false;

  const step = checkCode(user.totpSecret, code, user.email);
  if (step === null) return false;
  if (user.totpLastStep != null && step <= user.totpLastStep) return false;

  await db.update(users).set({ totpLastStep: step }).where(eq(users.id, userId));
  return true;
}

export const mfaRequiredFor = (role: string) => role === 'admin';
