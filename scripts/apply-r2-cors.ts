/**
 * Lets the dashboard put files straight into the bucket from a browser.
 *
 * Uploads no longer travel through the application — they are signed here and
 * sent by the browser to R2 — so the bucket has to say which sites may do
 * that. Without this the PUT is refused by the browser before it is sent, and
 * nothing reaches R2 at all.
 *
 * Only PUT and GET, only from our own origins, and only the headers an upload
 * actually uses. Re-running it replaces the rule rather than adding to it.
 *
 *   npx tsx --env-file=.env.local scripts/apply-r2-cors.ts          (show)
 *   npx tsx --env-file=.env.local scripts/apply-r2-cors.ts --write  (apply)
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';

/* Only the origins that actually serve this dashboard. spekegroup.com is the
   Group's own WordPress site and never uploads here, so it is not listed. */
const ORIGINS = [
  'https://speke-group.shinebebright.com',
  'https://speke-group.vercel.app',
  'http://localhost:3000',
];

async function main() {
  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('R2 credentials are missing from the environment.');
  }
  const s3 = new S3Client({
    region: 'auto', endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  try {
    const now = await s3.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET }));
    console.log('Current rules:', JSON.stringify(now.CORSRules, null, 2));
  } catch {
    console.log('Current rules: none set.');
  }

  if (!process.argv.includes('--write')) {
    console.log('\nWould set, for', ORIGINS.length, 'origins:', ORIGINS.join(', '));
    console.log('Re-run with --write to apply.');
    return;
  }

  await s3.send(new PutBucketCorsCommand({
    Bucket: R2_BUCKET,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: ORIGINS,
        AllowedMethods: ['PUT', 'GET', 'HEAD'],
        AllowedHeaders: ['content-type', 'cache-control'],
        ExposeHeaders: ['etag'],
        MaxAgeSeconds: 3600,
      }],
    },
  }));
  console.log('\nApplied.');
  const after = await s3.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET }));
  console.log(JSON.stringify(after.CORSRules, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
