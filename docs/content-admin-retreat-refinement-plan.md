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

## Delivered behaviour and verification

- Blog email heading defaults to the article title. Subject and introduction retain their existing defaults and personalisation; campaign delivery/deduplication is unchanged.
- Gallery editing uses the existing Contentful asset picker and database event-content gallery. Draft changes appear publicly only after publication. Travel Markdown preserves paragraph and address-line spacing.
- Coaching screens refresh authoritative data on entry and invalidate the coaching route after manual Everfit status changes. Closed access has a regression test. Blog reactions expose recoverable failures; comment requests ignore stale responses.
- Event page editors link to their dated instances; each instance links directly back to its event copy/photos.
- Venue synchronisation is explicit per future retreat, with a fingerprint checked inside a transaction. New occupancy prices are required; existing prices, paid bookings and room allocations are preserved. Historical purchases conservatively block structural changes until reviewed. Ambiguous legacy inventory mappings are not guessed or duplicated.
- A checkout that was quoted before inventory changes must refresh its selection instead of reserving a stale room configuration.
- Public cards, checkout and server quotes use the configured payment rule. Legacy room snapshots remain for compatibility, but cannot override an explicit percentage/fixed/full-payment rule.

### Checks

Focused unit tests cover content formatting/email copy, engagement routes, coaching closure, deposit display/quote parity, checkout persistence and stale selections, and venue-sync permissions. Database integration tests cover room additions, stale previews, preserved prices/paid bookings and allocation conflicts, plus blog comments/reactions/moderation. Production-mode Playwright covers reaction failure/retry, priced venue review on desktop/mobile and published gallery order/alternative text/lazy loading, with axe audits. Typecheck and production build pass. Lint has no errors; three pre-existing navigation warnings remain in `booking-modal.tsx` and `auth-context.tsx`.

### Deployment

No Prisma migration is required. Deploy the application and apply the narrow additive Contentful migration described above to the selected environment. Extra retreat photos are managed in the event page editor. After saving venue rooms, use **Review changes for existing retreats** and apply each reviewed instance; neither deployment nor saving a venue silently rebuilds existing inventory.

Optional read-only audit: `node --env-file=.env --experimental-strip-types scripts/audit-retreat-deposits.ts`. Select the intended environment explicitly. It reports legacy deposit snapshot discrepancies without changing configuration or bookings. There is no automatic production data repair.
