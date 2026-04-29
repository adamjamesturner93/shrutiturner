# Strength and Yoga Coaching

This is a native Next.js App Router project for Strength and Yoga Coaching.
The original design source is available at https://www.figma.com/design/3UJRjmwzRyNyxaqLWpD8ff/Strength-and-Yoga-Coaching.

## Running the code

Node version:

- Use Node `24.x` for this project (`.nvmrc` and `.node-version` are included).

1. Install dependencies with `pnpm install`.
2. Start local Postgres with `pnpm run db:up`.
3. Generate Prisma client with `pnpm run prisma:generate`.
4. Apply local migrations with `pnpm run prisma:migrate:dev`.
5. Start development with `pnpm dev`.
6. Build with `pnpm build`.
7. Run production server with `pnpm start`.

## Architecture

- Routing uses `src/app/` route files only (Next.js App Router).
- Public routes live under `src/app/(public)`.
- Dashboard/admin/account routes live under `src/app/(app)`.
- Shared modules live under `src/components`, `src/lib`, `src/data`, `src/context`.
- Page view components are organized under `src/views` and imported by route files.
- React Router has been removed from runtime and dependencies.

## Auth + Database

- Auth uses Auth.js (`next-auth` v5) with Prisma adapter.
- Sessions use database-backed session tokens with rolling renewal.
  - Default max session age: 30 days (`AUTH_SESSION_MAX_AGE_DAYS=30`)
  - Active sessions are renewed every 24h (`updateAge`)
- Local development DB is Postgres 16 in Docker (`docker-compose.yml`).
- Local Docker Postgres is exposed on `127.0.0.1:5433` to avoid collisions with any host Postgres on `5432`.
- Production should use Vercel Postgres (`DATABASE_URL` + optional `DIRECT_URL`).
- Route protection is enforced in `middleware.ts` for `/dashboard/**`, `/account/**`, `/admin/**`.
- Admin access is role-based via `User.role = admin` (or `ADMIN_EMAILS` bootstrap).

Useful commands:

1. `pnpm run db:up`
2. `pnpm run db:logs`
3. `pnpm run prisma:migrate:dev`
4. `pnpm run prisma:migrate:deploy`
5. `pnpm run prisma:seed:admin`
6. `pnpm run prisma:studio`
7. `pnpm run db:down`

### Environment workflow

- Local development:
  - Use `.env` with the Docker Postgres instance from `pnpm run db:up`.
  - Apply schema changes locally with `pnpm run prisma:migrate:dev`.
  - Seed local scenarios with `pnpm run prisma:seed:local`.
- Staging database:
  - Keep credentials in `.env.staging` only.
  - Check pending migrations with `pnpm run db:status:staging`.
  - Apply backward-compatible migrations with `pnpm run db:migrate:staging`.
- Production database:
  - Keep credentials in `.env.prod` only.
  - Check pending migrations with `pnpm run db:status:prod`.
  - Apply backward-compatible migrations with `pnpm run db:migrate:prod`.
- Important:
  - Do not use `prisma db push` against staging or production.
  - Remote migrations are run manually from a developer machine, not from CI or Vercel.
  - Because database deploys can happen shortly before code deploys, every staging/prod migration must be backward-compatible.

### Seed datasets

- `pnpm run prisma:seed:local`
  - Bootstraps the local app with admin users, current legal documents, local member scenarios, retreat inventory, and small-group fixtures.
- `pnpm run prisma:seed:preview`
  - Creates preview-safe owner/member/instructor fixtures, a booked dashboard session, and an active membership using clearly fake `*.preview.invalid` email addresses.
- `pnpm run prisma:seed:billing`
  - Adds deterministic class, membership, credit, and themed-week fixtures that support billing and timetable flows.
- Use `pnpm run db:reset:local` when you want a clean local rebuild from migrations plus the local seed.
- Use `PREVIEW_FIXTURE_NAMESPACE=<label> pnpm run prisma:seed:preview` to reseed preview/test environments without colliding with other fixture sets.

Prisma note:

- This workspace targets Prisma 7 (`prisma` and `@prisma/client` in `package.json`).
- Prisma CLI config lives in `prisma.config.ts` and the datasource URL is configured there.

## Contentful Integration

- Public marketing/SEO routes are wired through `src/lib/content`.
- Content source strategy is controlled by `CONTENT_SOURCE`:
  - `local`: use local fallback data only.
  - `hybrid`: Contentful first with local fallback.
  - `contentful`: Contentful only for CMS-managed data.
- CMS/public content API routes are available under `src/app/api/content/*`.
- Contentful webhook revalidation endpoint:
  - `POST /api/webhooks/contentful`

### Code-first CMS tooling

- Content model definitions:
  - `contentful/migrations/001-public-content-models.ts`
- Draft seed (initial content from current codebase):
  - `contentful/seed/public-seed.ts`

Run scripts:

1. `pnpm run contentful:migrate`
2. `pnpm run contentful:seed:drafts`

Required environment variables:

- `CONTENT_SOURCE`
- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_ENVIRONMENT` (default: `master`)
- `CONTENTFUL_DELIVERY_TOKEN`
- `CONTENTFUL_MANAGEMENT_TOKEN`
- `CONTENTFUL_PREVIEW_TOKEN` (optional)
- `CONTENTFUL_WEBHOOK_SECRET` (for webhook endpoint)

## Marketing Lead + Email Management

Use this split to keep content editable without risking transactional accuracy:

- `leadMagnet` (Contentful): the main marketing lead offer
  - Manage: `title`, `hookText`, `landingHeadline`, `landingDescription`, `ctaLabel`
  - Manage welcome delivery content: `emailSubject`, `emailPreviewText`, `emailBody`, `assetUrl`
- `newsletterSignupContent` (Contentful): signup form wrapper behavior
  - Manage: `activeLeadMagnet` (switch campaigns), `formPlaceholder`, `consentText`, `successMessage`

Operational flow:

1. Create/edit a `leadMagnet` entry.
2. Set `newsletterSignupContent.activeLeadMagnet` to that entry.
3. Signup UI and welcome email automatically use active lead magnet content.

Recommended Contentful ownership:

- Contentful-managed:
  - `newsletterTemplate`
  - `leadMagnet`
  - `newsletterSignupContent`
  - Optional marketing copy blocks in transactional emails
- Code/backend-managed:
  - Auth/security emails (`auth-code`)
  - Booking/payment state emails (`class-*`, `retreat-*`, credits reminders)

Postmark environment variables:

- `POSTMARK_API_TOKEN`
- `POSTMARK_FROM_EMAIL`
- `POSTMARK_MESSAGE_STREAM` (defaults to `outbound`)
- `POSTMARK_WEBHOOK_SECRET`
- `CONTACT_NOTIFICATION_EMAIL`
- `BLOG_COMMENT_NOTIFICATION_EMAIL`
- `COACHING_APPLICATION_NOTIFICATION_EMAIL`
- Optional: `RETREAT_NOTIFICATION_EMAIL`

Contentful publish automation:

- Publishing `blogPost` or `newsletterTemplate` triggers campaign creation/sending via:
  - `POST /api/webhooks/contentful`
- Campaign analytics are then populated from Postmark webhook events:
  - `POST /api/webhooks/postmark`

Email analytics + reconciliation:

- Postmark webhook ingestion:
  - `POST /api/webhooks/postmark`
- Manual backfill:
  - `pnpm run sync:postmark`

Stripe metrics reconciliation:

- Daily Stripe projections are stored in `BillingMetricDaily`.
- Manual backfill:
  - `pnpm run sync:stripe:metrics`

Turnstile environment variables:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

## Preview-safe jobs and focused E2E

- Scheduled jobs are registered centrally in `src/lib/jobs/registry.ts`.
- The infra-only cron endpoint is `POST /api/internal/jobs/[jobName]`.
- Protect cron requests with `INTERNAL_JOB_SECRET` and send it as `Authorization: Bearer <secret>`.
- Jobs marked `previewSafe: false` are skipped automatically when `VERCEL_ENV=preview`.
- Add new framework jobs by:
  - implementing a pure infrastructure handler under `src/lib/jobs/**`
  - registering it in `src/lib/jobs/registry.ts`
  - triggering it from Vercel Cron against `/api/internal/jobs/<jobName>`
- Keep business-domain schedulers out of the core registry. Domain routes can still reuse `runScheduledJob(...)` directly.
- Subscription compliance notices run through `POST /api/internal/subscriptions/process-notices`.
- Membership dunning runs through `POST /api/internal/subscriptions/process-dunning`.
- Protect subscription domain cron requests with `SUBSCRIPTION_COMPLIANCE_CRON_SECRET` or `INTERNAL_JOB_SECRET` and send it as `Authorization: Bearer <secret>`.
- Recommended production cadence: run both subscription notice and dunning endpoints daily.
- For incremental live checks around holding pages and newsletter flows, run:
  - `pnpm run test:e2e:newsletter`
- Full regression coverage remains available through:
  - `pnpm run test:e2e`
