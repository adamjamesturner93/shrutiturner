# Weekend checkout and admin checks

Updated 11 September 2026. These changes are local; deployment is reserved for the developer.
The checkout-only release worktree was abandoned as a deployment path when the developer requested
a combined weekend release. Its Vercel upload failed (CLI too old); no deployment was promoted.
Read-only verification confirmed the live domain still uses the 4 September deployment
`dpl_DfZWDmmSyS96FSJaxSyEDnuUGE7e`.

## Changes to check

- **Manage setup:** Event pages, Formats and Venue rooms each have an icon.
- **Formats:** open Manage setup → Formats → New format. Choose the event kind and enter defaults.
  Creating a format makes it available to new events; it does not change existing dates or prices.
- **Images:** use Choose image from library in the event creation/editor form. Upload and publish
  assets in the linked Contentful environment, refresh the picker, and choose a thumbnail. Add an
  accurate image description and check the crop. Event publication remains separate. The URL field
  is an optional fallback. Only published image assets appear; no management token reaches the browser.
- **Online workshop checkout:** summary, purchaser name/email, terms and waiver, and payment CTA.
  No phone, diet, emergency or health-data collection before purchase. Existing post-purchase studio
  setup/live-access requirements remain in place. This change does not make those requirements optional.
  The £35 price is unchanged. Replay wording appears only for dates marked as recorded.
- **Day retreat:** single date/ticket/payment choices are omitted, not presented as tasks. The compact
  summary retains date, ticket, location and amount. In-person health/emergency details remain.
- **All checkout types:** headings no longer contain hard-coded step numbers. Header/card spacing is
  reduced. Real choices (multiple dates, rooms, guest counts, deposits) remain visible.
- **Instance links:** select a later instance from the catalogue, proceed to checkout and go back.
  The selected date must be retained; do not silently book the first date. Unknown dates must require
  a new valid selection. Changing dates must not retain a room from the previous date.
- **Popups:** newsletter promotions must not open on checkout.

## Manual verification before publishing

1. Use a logged-out/private browser and a signed-in account. Test October and January instances.
2. Check online workshop, day retreat and residential retreat at mobile/desktop widths and 200% zoom.
3. Exercise gift mode, two-person private room/twin preference, multiple tickets and deposit choices.
4. Use Stripe test mode for payment/confirmation and confirm the right date and attendees in admin.
   Automated browser tests intercept payment submission and do not prove the provider payment flow.
5. Check post-purchase studio setup and access gating for a new customer; verify confirmation emails
   explain the next step. Do not use live charges or real customer emails for these checks.
6. Check the Contentful library with the intended environment and a newly published asset. Browser
   coverage mocks the asset response; credentials and real asset publishing need an environment check.
7. Review all pending migrations and the larger remediation plan before the combined release. This
   checklist is not confirmation that every package of that plan is finished. Apply remote migrations
   only via the repository's explicitly targeted migration scripts; do not use `prisma db push`.

## Automated coverage

Latest local results: **144 unit tests passed** across 24 files. All nine selected browser scenarios
passed (eight in the combined run; the admin navigation case passed on rerun after allowing time for
local compilation/login redirects). The Webpack production build passed, generating 198 static pages.
The default Turbopack build retains the previously documented local sandbox limitation.

- `tests/e2e/app/admin-ux-remediation.spec.ts`: image selection/alt text, new format, independent admin
  section failures, mobile reflow and accessibility.
- `tests/e2e/public/retreats/journeys.spec.ts`: catalogue, guest workshop submission with payment mocked,
  no health/emergency checkout fields, no redundant payment copy and accessibility.
- `tests/e2e/public/retreats/simple-journey.spec.ts`: temporary day-retreat fixture with the existing
  Powis House venue; single-choice suppression, preserved in-person fields, January link when an
  earlier instance exists, reflow and accessibility. Temporary event/date rows are cleaned up.
- Media service and staff-only API unit tests cover image filtering, configuration, pagination and
  authorisation. Retreat unit tests and checkout route tests cover the surrounding service behaviours.
- Checkout acceptance regression tests ensure online purchases require/record terms and waiver only,
  in-person purchases retain health-data consent, and gift purchases record purchaser terms only.

The broader unfinished work and rollout risks remain in [the progress log](admin-ux-remediation-progress.md).

## 12 September: layout and sold-out follow-up

- Venue cards now have a compact, marker-free summary row with a chevron and keyboard-operable
  disclosure. Room groups use two columns on wide screens and stack on mobile. Saved totals and
  unsaved/save/discard behaviour are preserved; no room inventory was changed.
- Unavailable room/ticket options are explicitly labelled sold out and disabled. Both booking and
  gifting links require an available selection. Direct checkout also disables submission for an
  unavailable option; the existing server-side inventory check remains authoritative.
- Online checkout uses a two-column desktop form with the selected event and post-purchase note on
  the left, and details/agreements/payment on the right. Alternate dates are behind Change date.
  The guest payment CTA is tested within the initial viewport at 1440×900 and 1366×768. Small screens,
  zoomed layouts, gifts, validation errors and more complex options may still need scrolling.
- Verification: 135 relevant unit tests passed; five public journey tests passed, with the laptop
  viewport assertion passing on its targeted rerun. Venue keyboard/reflow/axe checks and the sold-out
  regression passed. Typecheck and lint passed (the same three pre-existing navigation warnings).
  Venue desktop screenshot was inspected. No deployment or remote inventory change was performed.
- `simple-journey.spec.ts` follows explicit instance URLs rather than relying on cached catalogue
  contents after direct fixture creation. Catalogue links are covered separately in `journeys.spec.ts`.
