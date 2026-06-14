# Contentful Newsletter Automation

This release connects Contentful publish events to static blog revalidation and newsletter campaign sends.

## Webhook Endpoints

Configure Contentful to send publish, unpublish, archive and delete events to:

- `POST /api/webhooks/contentful`

The compatibility alias `POST /api/contentful/webhook` remains available, but new Contentful
webhooks should use `/api/webhooks/contentful`.

Set the `x-contentful-webhook-secret` header to the value in `CONTENTFUL_WEBHOOK_SECRET`. The
webhook fails closed in deployed environments if `CONTENTFUL_WEBHOOK_SECRET` is missing.

## Blog Publishing

Publishing, unpublishing, archiving, or deleting a `blogPost` revalidates:

- `/blog`
- `/blog/{slug}` when the slug is available in the webhook payload or can be resolved by entry ID

The blog post route uses static params from Contentful at build time, so published entries are generated statically during the build and then refreshed by on-demand revalidation after Contentful changes.

Published Contentful delivery reads are also cached with `CONTENTFUL_REVALIDATE_SECONDS`, defaulting
to `60`, so the site has a bounded fallback TTL if a webhook is delayed.

## Newsletter Publishing

`newsletterTemplate` entries can trigger a Postmark broadcast campaign when published.

Required fields:

- `title`
- `subject`
- `body`

Optional workflow fields:

- `sendDate`: future dates create a scheduled campaign instead of sending immediately.
- `segmentation`: currently supports `all_subscribers`.

All broadcast emails are sent only to active newsletter subscribers, include a signed unsubscribe link and persist `EmailCampaign`, `EmailDelivery`and `EmailDeliveryAttempt` records for reporting. Postmark webhook events then attach delivery, open, click, bounce, complaintand unsubscribe events back to those campaign records.

## Scheduled Sends

The scheduled-job runtime should call:

- `contentful_campaign_send`

This job sends due `EmailCampaign` rows with `status = scheduled` and `scheduledAt <= now`.

## Operational Notes

Keep Contentful model changes in `contentful/migrations/001-public-content-models.ts`. Remote Contentful migrations are applied manually from a developer machine; they are not run from CI or Vercel.
