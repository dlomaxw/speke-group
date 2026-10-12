/**
 * Where the dashboard's uploads go.
 *
 * Kept apart from lib/storage.ts, which is server-only and pulls in the whole
 * S3 client: the Content Security Policy is built in middleware, which must
 * stay small and must not import any of that. This file has no imports at all.
 *
 * The S3 client addresses a bucket as a subdomain of the account endpoint, so
 * both forms are listed. Derived from the environment rather than written out,
 * so moving bucket or account cannot quietly break uploads.
 */
export function mediaUploadOrigins(): string[] {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  if (!endpoint) return [];
  try {
    const { protocol, host } = new URL(endpoint);
    const origins = [`${protocol}//${host}`];
    if (bucket) origins.push(`${protocol}//${bucket}.${host}`);
    return origins;
  } catch {
    return [];
  }
}
