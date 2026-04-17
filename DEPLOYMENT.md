# Deployment Process

## Environment model

- local: Docker Postgres via `pnpm run db:up` and local `.env`
- staging: preview code deploy plus staging database controlled from `.env.staging`
- production: live code deploy plus production database controlled from `.env.prod`

All remote schema changes are applied from committed Prisma migrations. Do not edit staging or production schemas by hand.

## Environment files

Keep these files local and out of git:

- `.env`
- `.env.staging`
- `.env.prod`

Tracked templates are provided as:

- `.env.example`
- `.env.staging.example`
- `.env.prod.example`

`prisma.config.ts` now prefers explicit environment variables over `.env`, so the deploy scripts can safely target staging or production without accidentally falling back to the local database.

## Database deploy commands

Check status first:

- `pnpm run db:status:staging`
- `pnpm run db:status:prod`

Apply migrations:

- `pnpm run db:migrate:staging`
- `CONFIRM_PROD_DB_DEPLOY=deploy-prod pnpm run db:migrate:prod`

The production command requires an explicit confirmation variable and refuses to run if `.env.prod` points at `localhost` or `127.0.0.1`.

## Release order

Recommended order for schema changes:

1. create the migration locally with `pnpm run prisma:migrate:dev`
2. test locally against the local database
3. apply the migration to staging with `pnpm run db:migrate:staging`
4. deploy the code to staging and test it there
5. apply the migration to production with `CONFIRM_PROD_DB_DEPLOY=deploy-prod pnpm run db:migrate:prod`
6. deploy or promote the corresponding code release

## Backward compatibility rule

There can be a short gap between database release and code release. Because of that, staging and production migrations must be backward-compatible.

Prefer expand-and-contract changes:

- add new nullable columns before code starts writing to them
- keep old columns and reads in place until the new code is live
- backfill separately where needed
- only remove old columns or constraints in a later migration after the new code has been deployed safely

Avoid breaking changes that require the new app version to be live at the exact same moment as the migration.

## Vercel

Keep Vercel focused on code deploys only:

- Preview uses the staging runtime secrets
- Production uses the live runtime secrets
- Prisma migrations are not run automatically from Vercel

This keeps database changes explicit and under your control from the local machine.
