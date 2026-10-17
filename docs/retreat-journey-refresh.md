# Retreat journey refresh

## Behaviour

Retreat discovery uses an illustrated, keyboard-accessible menu populated from the public event catalogue. The menu loads only when opened; the catalogue link remains available when previews cannot load. Past events are excluded and sold-out events remain labelled. The menu previews the next available date, or the next sold-out date when none remain. Automatic newsletter popups are suppressed throughout retreat browsing and booking; the existing newsletter links remain available.

Residential pages present suitability, inclusions, host, accommodation/gallery and food before the daily schedule. Section links provide direct access to the booking area. A desktop booking sidebar and mobile booking bar use the existing selected date, room, guest count and pricing. The mobile bar hides while the booking area is visible. Room choices expand inside the sidebar; the same panel follows the main content on mobile. Alternatives collapse after selection. The inclusions section uses a contrasting brand-colour panel. Both level-two Markdown headings and legacy weekday-prefixed schedules become accessible day-by-day accordions, preserving the single editor field. Each panel shows its full date calculated from the selected retreat start in its timezone. Venue addresses from Contentful power a directly embedded Google Map and directions link; missing addresses omit the map. Shared beds remain one-person purchases; inventory and payment calculations are unchanged.

Checkout preserves the chosen room, collects purchaser details before optional extras, and retains attendee preparation after payment. Confirmation summarises the purchase and explains self, second-attendee and gift next steps. An unpaid completed Stripe session is not described as payment received. No health information is added to the success page.

Reviews use a shared carousel showing 2½ cards on desktop (when at least three exist) and part of the next card on mobile, with full quotes, context labels, swipe/keyboard scrolling, previous/next and pause controls. Continuous movement pauses on hover, keyboard focus or other interaction, offscreen and in hidden tabs; reduced motion disables it. One review is static and missing reviews omit the section.

The catalogue separates retreat and workshop dates, uses wider image-led retreat cards, and presents the existing teaching principles in a photographic “Why join me” section. Cards expand on hover, keyboard focus or click on desktop; all descriptions remain visible in the stacked mobile layout. Reduced-motion preferences disable the expansion animation.

Next.js and its ESLint config are updated together to 16.4.2. `partialPrefetching: false` explicitly preserves the existing Link prefetch behaviour during this upgrade.

## Contentful rollout (not applied by this change)

No database migration is required. The code works against the current CMS schema, falling back to legacy approvals. Existing event/overview selection IDs are preserved but no longer control the review pool.

The new optional `reviewAreas` field offers **Home**, **Coaching**, **Retreats & Workshops**. Multiple approvals are allowed. The legacy `approvedPlacements` field is retained, delivery-visible and disabled for editing. This lets the previous application version continue reading its original approvals. The legacy testimonial-selection model is not deleted.

1. Apply only the additive testimonial model to the intended environment, first sandbox:
   `CONTENTFUL_ENVIRONMENT=sandbox CONTENTFUL_MIGRATION_TYPES=testimonial pnpm run contentful:migrate`
2. Preview the copy into the new field:
   `CONTENTFUL_ENVIRONMENT=sandbox node --experimental-strip-types contentful/scripts/migrate-review-areas.ts`
3. Review the output. Resolve unpublished edits separately; the script refuses to publish them. Then repeat with `--apply` if authorised.
4. Verify Home and Coaching approvals are preserved; both old retreat approvals map to Retreats & Workshops. Class-only approvals are not automatically reclassified. Quotes retain their original text and context.
5. Repeat the reviewed process for `master` only when production release is authorised.

The backfill preserves locales, legacy fields and draft/published status and skips entries already using the new field. Explicit empty new approvals suppress a quote. Existing selections and the original approvals remain available for rollback. New editorial decisions in the new field do not update the legacy field; account for this if reverting to old code.

The new shared component is ready for coaching; this change does not redesign the coaching page. Room-specific photographs have not been fabricated: the accommodation section uses the existing event gallery and captions.

## Local editorial preview

The local `local-powis-room-review` experience uses a snapshot of the published editorial JSON from production experience `cmu77atr6000904jvch9us3vw`, read in a read-only transaction. The snapshot is in `scripts/fixtures/powis-review-content.json` for reproducible seeds. Production was not changed. Existing local inventory, prices and payment settings were preserved. The local arrival/departure times were aligned with the authored 3pm arrival and 11am checkout on the same dates.

Schedule headings retain their editorial titles and list items render as separate icon-led rows. The accommodation gallery uses the three published photos with their alt text and focal points, horizontal partial-card thumbnails, and a keyboard-accessible lightbox.

## Validation

Run typecheck, lint, relevant content/retreat unit tests, the standalone retreat UX component tests and the local Powis checkout tests. The latter require Docker/Postgres, the existing local room-review fixture and the development server:

`POWIS_ROOM_REVIEW=1 pnpm exec playwright test --config playwright.retreat-ux.config.ts --workers=1`

These tests do not submit a payment or send attendee emails. Verify the production build with `pnpm exec next build --webpack` when local Turbopack worker restrictions prevent a normal build.
