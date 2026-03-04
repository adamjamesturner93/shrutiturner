# Strength and Yoga Coaching

This is a native Next.js App Router project for Strength and Yoga Coaching.
The original design source is available at https://www.figma.com/design/3UJRjmwzRyNyxaqLWpD8ff/Strength-and-Yoga-Coaching.

## Running the code

1. Install dependencies with `pnpm install`.
2. Start development with `pnpm dev`.
3. Build with `pnpm build`.
4. Run production server with `pnpm start`.

## Architecture

- Routing uses `src/app/` route files only (Next.js App Router).
- Public routes live under `src/app/(public)`.
- Dashboard/admin/account routes live under `src/app/(app)`.
- Shared modules live under `src/components`, `src/lib`, `src/data`, `src/context`.
- Page view components are organized under `src/views` and imported by route files.
- React Router has been removed from runtime and dependencies.

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
