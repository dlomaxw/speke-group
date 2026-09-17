import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * AES-256-GCM for small secrets kept in the database (authenticator seeds).
 * The key is derived from AUTH_SECRET, so a copy of the database alone does
 * not reveal them.
 */
function key(purpose: string) {
  const base = process.env.AUTH_SECRET;
  if (!base || base.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set to at least 32 characters.');
    }
    return createHash('sha256').update(`dev-only-insecure-secret:${purpose}`).digest();
  }
  return createHash('sha256').update(`${base}:${purpose}`).digest();
}

export function seal(plain: string, purpose: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(purpose), iv);
  const body = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), body.toString('base64url')].join('.');
}

export function open(sealed: string, purpose: string) {
  const [version, iv, tag, body] = sealed.split('.');
  if (version !== 'v1' || !iv || !tag || !body) throw new Error('Unreadable sealed value.');
  const decipher = createDecipheriv('aes-256-gcm', key(purpose), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(body, 'base64url')), decipher.final()]).toString('utf8');
}
