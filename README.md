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
