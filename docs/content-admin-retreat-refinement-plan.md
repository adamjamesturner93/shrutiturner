# Content, admin and retreat refinements

## Commit 1 — Content and photography

Separate optional blog email subject, heading and introduction; retain defaults and campaign deduplication. Expose the existing event gallery in admin and public pages. Preserve Contentful travel paragraphs, line breaks, lists and safe links.

## Commit 2 — Engagement and admin journeys

Finish existing comments/reactions with error recovery and permissions coverage. Correct stale Everfit closure instructions. Provide reciprocal event/instance navigation.

## Commit 3 — Rooms and payments

Preview venue changes before applying to future instances. Preserve booking allocations and prices; block capacity conflicts and require prices for new options. Use authoritative deposit rules consistently across display and server quotes, preserving existing booking amounts.

## Verification and rollout

Use synthetic tests without resetting local bookings. Run focused unit/integration and Playwright checks, accessibility, typecheck, lint and production build. Remote migrations and data corrections are separate manual deployment steps.

### Commit 1 deployment

Run `node --experimental-strip-types contentful/scripts/add-blog-email-heading.ts` with the explicitly selected Contentful environment to preview the additive schema change; repeat with `--apply` after checking the environment. The script preserves other fields and does not update/publish entries or trigger campaigns. No database migration is needed for gallery content.
