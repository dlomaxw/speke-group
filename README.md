# Speke Group — website and content dashboard

A Next.js app that serves the public Speke Group site and the staff dashboard
used to edit it.

## Running locally

```bash
npm install
npm run db:setup   # creates the tables and loads the current site content
npm run dev        # http://localhost:3000
```

The dashboard is at `/admin`. The seed creates four accounts, all with the
password `Speke2026@`, each of which must be changed on first sign-in:

| Email                      | Role             | Can do                                        |
| -------------------------- | ---------------- | --------------------------------------------- |
| `it@spekegroup.com`        | Administrator    | Everything, including staff accounts           |
| `gm@spekegroup.com`        | General Manager  | Publish content, handle enquiries              |
| `marketing@spekegroup.com` | Marketing        | Create and edit drafts, handle enquiries       |
| `viewer@spekegroup.com`    | Viewer           | Read only                                      |

Change these before the site goes anywhere public.

## The database

The schema is SQLite and lives in two places:

- **Production** runs on Cloudflare D1 (`speke-group-db`), reached over
  Cloudflare's HTTP API. Vercel sets `DATABASE_TARGET=d1`.
- **Development** uses a local file, `local.db`, created by `npm run db:setup`.
  Scripts can run while `npm run dev` is up.

To run a script against production, load the env file and target D1:

```bash
DATABASE_TARGET=d1 npx tsx --env-file=.env.local scripts/migrate.ts
```

`scripts/seed.ts` wipes and reloads all site content (staff accounts are kept),
so do not run it against production once the team has started editing.

## Environments

| Environment | Database | Who can open it |
| --- | --- | --- |
| Production (`speke-group.shinebebright.com`) | D1 `speke-group-db` | Everyone; `/admin` needs sign-in |
| Preview / staging (Vercel preview URLs) | D1 `speke-group-db-staging` | Vercel team members only; never indexed |
| Local | `local.db` | You |

Preview deployments carry `X-Robots-Tag: noindex` and a disallow-all `robots.txt`.

## Enquiries and staff alerts

`POST /api/enquiries` needs an `Idempotency-Key` header (the contact form sends
one). It returns `201` with a reference only after the enquiry is stored; the
same key again returns the same receipt; `422` for invalid fields, `429` when
rate limited, `503` when nothing could be stored.

A database trigger queues a staff alert in the same statement that stores the
enquiry. Alerts send after the response, retry with backoff, and after eight
failures show as failed on the Enquiries screen with a retry button. A daily
Vercel Cron call (`/api/cron/outbox`, protected by `CRON_SECRET`) sweeps
anything left over.

Alerts stay queued until email sending is configured:

| Name | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Email provider key |
| `ALERT_FROM_EMAIL` | Verified sender, e.g. `Speke Group <alerts@spekegroup.com>` |
| `SITE_URL` | Optional; the dashboard link in alerts |

Recipients come from **Site settings → General → Send enquiry alerts to**
(comma-separated). Alerts carry the reference, property, dates and a dashboard
link, never the guest's contact details or message.

## Editing safety

- Every save keeps a version; managers restore any earlier version, including
  deleted items, from the edit page or the list.
- Edits by staff who cannot publish, to content that is already live, wait
  under **Changes to approve** until a manager approves them.
- **Preview site** shows drafts and waiting changes at phone, tablet and
  desktop widths, to signed-in staff only.
- Staff can be limited to chosen properties (Staff & roles); they cannot edit
  other properties' content, group-wide content, or see other properties'
  enquiries.
- Uploaded media needs a manager to approve its usage rights before it can be
  placed on the site.
- Administrators must use two-step sign-in (authenticator app). An
  administrator can reset another person's two-step sign-in after a lost phone.

## Backups and restore

D1 keeps point-in-time history (Time Travel). Restore drill, tested on staging
on 17 September 2026:

```bash
# 1. Find the restore point for a moment in time (ISO timestamp)
curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"   "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database/$DB_ID/time_travel/bookmark?timestamp=2026-09-17T10:00:00Z"
# 2. Restore to it (replaces the whole database; enquiries received since are lost,
#    so export them from the dashboard first)
curl -X POST -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"   "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/d1/database/$DB_ID/time_travel/restore?bookmark=<bookmark>"
```

How far back history reaches depends on the Cloudflare plan. Always rehearse
on staging first.

## Media

Images and video upload to Cloudflare R2 and are served from its public bucket
URL. The dashboard refuses uploads and says so if the keys are missing.

## Environment variables

| Name                   | Needed for                                  |
| ---------------------- | ------------------------------------------- |
| `AUTH_SECRET`          | Signing session cookies. 32+ characters. Required in production. |
| `DATABASE_TARGET`      | `d1` in production; unset locally uses `local.db` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account that owns the D1 database |
| `CLOUDFLARE_D1_DATABASE_ID` | The D1 database id                     |
| `CLOUDFLARE_API_TOKEN` | Token with D1 edit access                    |
| `R2_ACCOUNT_ID`        | Cloudflare R2 account                        |
| `R2_ACCESS_KEY_ID`     | R2 credentials                               |
| `R2_SECRET_ACCESS_KEY` | R2 credentials                               |
| `R2_ENDPOINT`          | R2 S3 endpoint                               |
| `R2_BUCKET`            | Bucket name                                  |
| `R2_PUBLIC_BASE`       | Public URL media is served from              |

## Commands

| Command             | What it does                              |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Development server                         |
| `npm run build`     | Production build                           |
| `npm run db:generate` | Write a migration after changing the schema |
| `npm run db:migrate`  | Apply migrations                          |
| `npm run db:seed`     | Load site content and starter accounts    |
| `npm run db:setup`    | Migrate then seed                         |
