# ADR 0001: Integration Architecture

## Status

Accepted

## Context

Studio Foundations needs one source of truth for third-party integrations, their operational boundaries, and the runtime contracts the app uses to talk to them.

## Decisions

### Service roles

- Postmark handles transactional email and marketing email delivery.
  - Transactional stream: `transactional`
  - Marketing stream: `broadcast` or the configured marketing stream alias
- Stripe handles payments, subscriptions, portal access, and webhook processing.
- Daily handles live rooms and meeting tokens for classes and coaching calls.
- Contentful handles CMS-managed marketing and editorial content.
- Everfit remains a manual downstream delivery tool in v1.
- Calendly remains an embedded/manual scheduling tool in v1.
- GA4 is loaded in the root layout and configured from platform settings, with `GA4_MEASUREMENT_ID` available as a fallback.

### Environment schema

The integration env surface is documented and parsed through `src/lib/env.ts`.

- `POSTMARK_SERVER_TOKEN`
- `POSTMARK_API_TOKEN`
- `POSTMARK_FROM_EMAIL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DAILY_API_KEY`
- `CONTENTFUL_SPACE_ID`
- `CONTENTFUL_DELIVERY_TOKEN`
- `CONTENTFUL_MANAGEMENT_TOKEN`
- `GA4_MEASUREMENT_ID`

### Provider contracts

Framework-facing provider contracts live in `src/lib/integrations/contracts.ts`.
Concrete adapters live in `src/lib/integrations/providers.ts`.

- `EmailProvider` -> `postmarkEmailProvider`
- `PaymentProvider` -> `stripePaymentProvider`
- `VideoProvider` -> `dailyVideoProvider`
- `CMSProvider` -> `contentfulCmsProvider`

These adapters currently standardise health checks and expose a stable place to grow richer provider methods without leaking vendor specifics through route handlers.

### Health checks

`GET /api/health` validates:

- database reachability
- Stripe connectivity
- Postmark connectivity
- Contentful connectivity

The route is owner-admin protected and returns structured per-provider status.

### Error handling and resilience

- Third-party calls are wrapped in provider/service boundaries under `src/lib/**`.
- Health checks and provider adapters surface structured messages instead of raw fetch failures.
- Contentful uses a soft-fail approach in `src/lib/content/contentful-client.ts`: failed CDA requests return `null`, which allows hybrid/local fallback paths to continue serving content.
- GA4 is treated as non-critical. Missing measurement IDs disable analytics without blocking rendering.

### Security

- Integration secrets stay server-side and are parsed in `src/lib/env.ts`.
- Stripe webhook signature validation remains in `src/app/api/webhooks/stripe/route.ts`.
- Postmark authentication uses server-side tokens only.
- Cron runtime uses `INTERNAL_JOB_SECRET` for the infra scheduler endpoint.

## Consequences

- New integrations should be added behind a provider contract first, then consumed from domain services.
- Health/ops tooling has a single place to verify provider connectivity.
- CMS and analytics failures degrade gracefully instead of taking the site down when fallback paths exist.
