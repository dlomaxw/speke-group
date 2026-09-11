import 'server-only';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomBytes } from 'node:crypto';

const ACCEPTED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'application/pdf',
]);

/** 100 MB: comfortably covers a compressed hero video, rejects a raw upload. */
export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

function client() {
  const endpoint = process.env.R2_ENDPOINT;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
}

export function storageConfigured() {
  return Boolean(client() && process.env.R2_BUCKET && process.env.R2_PUBLIC_BASE);
}

function safeName(name: string) {
  const dot = name.lastIndexOf('.');
  const ext = dot > -1 ? name.slice(dot).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  const base = (dot > -1 ? name.slice(0, dot) : name)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'file';
  return `${base}-${randomBytes(4).toString('hex')}${ext}`;
}

export type UploadResult = { url: string; pathname: string; bytes: number; contentType: string };

export async function uploadFile(
  file: File,
  folder = 'general',
): Promise<UploadResult> {
  if (!ACCEPTED.has(file.type)) {
    throw new Error(`That file type is not allowed (${file.type || 'unknown'}).`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 100 MB.`);
  }

  const s3 = client();
  const bucket = process.env.R2_BUCKET;
  const base = process.env.R2_PUBLIC_BASE;
  if (!s3 || !bucket || !base) {
    throw new Error('Media storage is not configured. Ask IT to set the R2 keys.');
  }

  const cleanFolder = folder.replace(/[^a-z0-9-]/gi, '').toLowerCase() || 'general';
  const key = `${cleanFolder}/${safeName(file.name)}`;
  const body = Buffer.from(await file.arrayBuffer());

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: file.type,
    // Media is content-addressed by its random suffix, so it can be cached hard.
    CacheControl: 'public, max-age=31536000, immutable',
  }));

  return {
    url: `${base.replace(/\/$/, '')}/${key}`,
    pathname: key,
    bytes: file.size,
    contentType: file.type,
  };
}

export async function deleteFile(pathname: string) {
  const s3 = client();
  const bucket = process.env.R2_BUCKET;
  if (!s3 || !bucket) return;
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: pathname }));
}
