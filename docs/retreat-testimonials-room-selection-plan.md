# Retreat testimonials and room selection

Approved refinement: Contentful owns quotes/context and explicit multi-area approval. Event admins select and order up to three published, event-approved quote IDs in the existing draft/published JSON. A Contentful overview selection orders up to three overview-approved quotes; prefer two. No automatic cross-area fallback. Place event quotes after inclusions, overview quotes before cards.

Room selection groups existing inventory options by shared/private room and structured bathroom type, then reveals real bed choices, supported occupancy and exact prices. Preserve option IDs, inventory, deposit rules and checkout validation. Nullable bathroom metadata is an additive migration; only explicitly labelled existing groups are backfilled. Unknown stays unknown.

Verify placement filtering and publishing, grouping/prices/sold-out behaviour, checkout handoff, desktop/mobile keyboard and accessibility, typecheck/lint/relevant tests, and production build. Do not deploy or change production bookings. Remote migrations remain manual.

## Deployment / editorial checklist

1. Apply the additive database migration using the existing staging/production deploy scripts from a developer machine. The nullable column and explicit-label backfill are safe with the previous application version.
2. In the intended Contentful environment run `CONTENTFUL_MIGRATION_TYPES=testimonial,testimonialSelection pnpm run contentful:migrate`.
3. Dry-run `node --experimental-strip-types contentful/scripts/backfill-testimonial-placements.ts`; rerun with `--apply` after reviewing. It preserves existing approvals, approves only Home for legacy featured quotes, and skips published entries with unpublished edits. Resolve those manually before deploying so homepage quotes are preserved.
4. Publish authentic quotes with approved areas and truthful context labels. Create a Testimonial selection with Page `retreats-overview` and ordered references (two recommended, maximum three). Referenced quotes must also approve `retreats-overview`.
5. In Edit Event Page, select up to three event-approved quotes, save and publish. Removing approval or unpublishing in Contentful suppresses a selected quote without republishing the event.
6. Review unknown bathroom types in venue setup. Private bathroom does not mean en-suite. Existing bookings and room inventory remain unchanged.

No remote database or Contentful changes are applied automatically by this implementation.

## Resumed review — 4 October 2026

### Follow-up deployment

- At the user's request, applied `20261002070000_retreat_room_bathroom_type` to production using `CONFIRM_PROD_DB_DEPLOY=deploy-prod pnpm run db:migrate:prod`. A subsequent production status check confirms all 36 migrations are applied.
- Changed Approved display areas to Contentful's built-in checkbox editor with Home, Coaching, Retreats General and Retreat. The migration runner retains this editor configuration on future runs; extend the allowed values and website mapping together when adding areas.
- Website content loading accepts both the original internal keys and the readable labels. Seed/backfill scripts use Home going forward. `rename-testimonial-placements.ts` offers a dry run, validates all entries first, preserves draft-only status and refuses to publish entries with unpublished changes.
- Converted the three existing Home approvals after the reviewed dry run; no new display areas were approved and no newsletters were published.

- Reviewed the unstaged implementation: event quote selection/order, explicit placement approvals, grouped room categories, exact inventory IDs, occupancy prices and deposits remain implemented.
- Contentful `master` now contains all fields in the local model, including Publication email subject, heading and introduction, testimonial approvals/context, and testimonial selections.
- Found and corrected a deployment compatibility issue: legacy newsletter `body` must remain delivery-visible while existing entries still use it. Updated the model to `omitted: false` and deployed only `newsletterTemplate` with the existing migration runner. No newsletter entries were published and no emails were sent.
- Applied the reviewed testimonial placement backfill to three existing featured quotes in `master`, approving Home only. Other placements still need deliberate editorial approval and selection.
- Rechecked 41 focused unit/integration tests and all four desktop/mobile retreat UX Playwright checks, including axe. The newsletter model regression also passes. Typecheck passes; lint reports only the three existing navigation warnings.
- The previously reviewed production build remains the build evidence for the retreat UI; this resumed work changes only newsletter schema compatibility and its regression assertion.
- The production database migration was subsequently applied at the user's request; see Follow-up deployment above. Other environments must apply it before deploying the application changes.
- Existing linked schedule-day content remains readable through legacy fields; copying it to the new editable activity field is a separate content migration, not performed by the schema deployment.
- Working-tree changes remain unstaged for review; no application commit, push or deployment was performed.

## Verification

## Checkout follow-through — 5 October 2026

- Keep the selected room visible at checkout; expand alternatives only through Change room selection. Preserve room ID, occupancy and bed preference from the sales-page link.
- Remove phone, emergency contact, dietary/access and health inputs from financial checkout. Collect those and participation agreements in authenticated attendee registration for self, additional attendees and gifts.
- Keep commercial terms/refund consent at checkout; retain server-side attendee readiness, health privacy, entitlement and payment checks.
- Verify room switching/collapsing, sensitive-field absence from checkout payloads, commercial-only checkout requirements, and existing registration validation.
- Implemented selected-room collapse, private-field removal at the checkout API boundary, and commercial-terms-only financial checkout. Attendee participation requirements remain in post-payment registration.
- Checkout now loads authoritative current Terms acceptance before rendering. An outdated account summary cannot show the green accepted state. Guests receive the current policy version from the server, and the payment endpoint still rechecks for changes while the page is open.
- Agreement confirmation uses an explicit non-submit button, avoiding accidental payment form submission.
- Verification: 26 focused checkout/room-booking unit tests pass, including stale/current acceptance and guest policy-version regressions. Desktop and mobile checkout Playwright journeys pass, including axe checks; typecheck passes and lint has only the three existing navigation warnings. No payment was submitted.

- Initial verification used the local additive migration. Production was subsequently migrated as recorded above; staging was not changed.
- Typecheck and production webpack build pass. Lint has no errors and three existing navigation warnings.
- 189 relevant unit tests and five event-creation/publishing integration tests pass. The publishing regression confirms ordered quote IDs persist and draft changes do not alter published quotes.
- Desktop and 390px mobile Playwright component journeys pass, including keyboard room selection, exact option IDs, sold-out categories, quote ordering/limits, no horizontal overflow and axe WCAG checks. Screenshots reviewed.
- Optional Contentful failures suppress quotes rather than blocking the page, including before the new model exists. Real quote selection/publication still requires the editorial checklist above.
- A broader content test run exposed one unrelated existing assertion in `markdown-content.test.ts`: it expects a plain paragraph while the renderer now adds `whitespace-pre-line`. The renderer was not changed by this task.
- Reviewed the real overview and Powis House detail page in the local production build. The overview remains usable before the Contentful model migration; no empty quote section appears. Desktop/mobile room controls render without horizontal overflow. Selecting the private king room preserves the exact checkout date, room option ID and guest count. No booking or payment was submitted.
