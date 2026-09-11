import { S3Client, ListBucketsCommand, CreateBucketCommand, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

const BUCKET = env.R2_BUCKET;

(async () => {
  const list = await s3.send(new ListBucketsCommand({}));
  console.log('buckets:', (list.Buckets ?? []).map(b => b.Name).join(', ') || '(none)');

  let exists = true;
  try { await s3.send(new HeadBucketCommand({ Bucket: BUCKET })); }
  catch { exists = false; }

  if (!exists) {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
    console.log('created bucket:', BUCKET);
  } else {
    console.log('bucket already present:', BUCKET);
  }

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET, Key: '_healthcheck.txt',
    Body: 'ok', ContentType: 'text/plain',
  }));
  console.log('write test: ok');
})().catch(e => { console.error('R2 ERROR:', e.name, e.message); process.exit(1); });
