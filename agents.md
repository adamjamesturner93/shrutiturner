# AGENTS.md

## Project purpose

This is the Strength and Yoga Coaching web application. It includes the public marketing site, Auth.js login/signup flows, member dashboard, admin tools, class and small-group booking, retreat checkout, coaching applications, blog/newsletter features, and supporting integrations for billing, email, CMS, and live sessions.

## Stack

- Next.js App Router (`next@16`)
- React 19
- TypeScript (`strict: false` in the current repo; do not assume strict mode)
- Tailwind CSS 4 + shadcn/ui + Radix UI
- Prisma 7 + PostgreSQL
- Auth.js v5 (`next-auth`)
- Vitest for unit/integration tests
- Playwright for e2e tests
- Contentful, Stripe, Postmark, Daily, and Cloudflare Turnstile integrations

## Rules

- Prefer server components by default.
- Use client components only when state/effects/browser APIs are required.
- Route files live in `src/app`; page-level view components live in `src/views`.
- Public routes are grouped under `src/app/(public)` and signed-in/admin flows under `src/app/(app)`.
- Reuse existing shared UI from `src/components` and `src/components/ui` before adding new primitives.
- Keep server-side business logic and integrations in `src/lib`.
- Use the `@/` import alias for project imports.
- Never call the database directly from client components.
- Do not introduce `any`.
- Do not edit Prisma schema unless the task explicitly requires it.
- Remote database migrations are applied manually from a developer machine using the repo's env-specific deploy scripts, not automatically from CI or Vercel.
- Staging and production migrations must be backward-compatible because the database can be updated shortly before the corresponding code deploy.
- Never use `prisma db push` against staging or production.
- Preserve the existing service boundaries around billing, content, newsletter, classes, referrals, retreats, coaching, and admin modules.

## API / data access

- Follow the existing pattern of route handlers in `src/app/api/**` for HTTP endpoints and webhooks.
- Keep database and third-party service access in server-only modules under `src/lib/**`.
- Prefer extending existing modules such as `src/lib/content`, `src/lib/billing`, `src/lib/newsletter`, `src/lib/classes`, `src/lib/retreats`, and `src/lib/coaching` instead of creating duplicate access layers.
- Use `revalidatePath` after successful writes where needed.

## UI

- Reuse existing design system components first.
- Keep page assembly in `src/views` when a route is primarily presentational.
- Target WCAG 2.2 AA compliance as closely as practical for all user-facing work, and treat regressions against that bar as bugs unless there is a documented exception.
- Maintain semantic structure, WCAG-friendly labels, keyboard access, visible focus states, sufficient color contrast, and clear error messaging.
- Preserve the existing visual language and avoid replacing established components without a clear reason.

## Testing

- Add or update tests for non-trivial logic changes.
- For bug fixes, include a regression test when practical.
- Unit tests live in `tests/unit`, integration tests in `tests/integration`, and e2e coverage in `tests/e2e`.
- Prefer the smallest relevant test slice first (`vitest` for logic/routes, Playwright for user journeys).
- Add or update automated accessibility checks when changing public UI, and use axe/Playwright audits to catch WCAG 2.2 AA issues where practical.

## Before finishing

- Run `pnpm run typecheck`, `pnpm run lint`, and relevant tests for the area changed.
- Use `pnpm run test:unit`, `pnpm run test:integration`, and `pnpm run test:e2e` selectively; `pnpm test` runs the full suite.
- Summarize changed files and any follow-up risks.

## Local environment

- Use Node `24.x` as declared in `.nvmrc` / `.node-version`.
- Local Postgres runs through Docker via `pnpm run db:up`.
- Prisma CLI configuration lives in `prisma.config.ts`.
- Use `.env.staging` and `.env.prod` for explicit remote migration commands only; keep production credentials out of the default local `.env`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
