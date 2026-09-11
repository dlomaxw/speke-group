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
password `SpekeGroup#2026`, each of which must be changed on first sign-in:

| Email                      | Role             | Can do                                        |
| -------------------------- | ---------------- | --------------------------------------------- |
| `it@spekegroup.com`        | Administrator    | Everything, including staff accounts           |
| `gm@spekegroup.com`        | General Manager  | Publish content, handle enquiries              |
| `marketing@spekegroup.com` | Marketing        | Create and edit drafts, handle enquiries       |
| `viewer@spekegroup.com`    | Viewer           | Read only                                      |

Change these before the site goes anywhere public.

## The database

With `DATABASE_URL` set, the app uses that Postgres. Without it, it falls back
to PGlite, a wasm Postgres stored in `.pglite/`, so a fresh clone runs with
nothing to install.

**PGlite is single-process.** Do not run `db:seed` or `db:migrate` while
`npm run dev` is running: both processes open the same store and it corrupts,
after which every query fails with `RuntimeError: Aborted()`. Stop the server
first, or delete `.pglite/` and re-run `npm run db:setup` to recover. Production
uses real Postgres and has no such limit.

## Media

Images and video upload to Cloudflare R2 and are served from its public bucket
URL. The dashboard refuses uploads and says so if the keys are missing.

## Environment variables

| Name                   | Needed for                                  |
| ---------------------- | ------------------------------------------- |
| `AUTH_SECRET`          | Signing session cookies. 32+ characters. Required in production. |
| `DATABASE_URL`         | Postgres. Falls back to local PGlite if unset. |
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
