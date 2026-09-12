# Retreat and workshop administration

## The three reusable building blocks

1. **Formats** define capabilities and safe defaults: residential retreat, day retreat, in-person
   workshop or live online workshop.
2. **Event Pages** contain reusable public content. Draft edits are private until explicitly published.
3. **Venues** keep editorial/travel copy in Contentful while physical rooms and selling rules live in
   the app.

A dated event links to one Event Page and one format. Multiple dates can share the same Event Page,
without duplicating content or stock.

## Create an event

1. Open **Retreats and workshops → Create event**.
2. Choose the format first. Its capabilities decide whether the event needs a venue, rooms, tickets or
   a live session, and whether deposits are allowed.
3. Reuse an existing Event Page or create a draft from the format starter content.
4. Enter the date/time, timezone, capacity and initial price. Non-residential formats use one-person
   tickets and full payment. Residential retreats continue to room and payment setup.
5. Save the draft. New content and its date are created in one database transaction. A persisted
   request key lets the creation page recover a completed request after a lost response without
   creating another event. The key is retained in the page URL; form content is not stored there.
6. Complete the setup checklist and open bookings. Publishing the Event Page and opening a dated event
   are separate actions.

Use **Event Pages** to edit title, description, atmosphere, inclusions, one Markdown schedule, image alt
text, image focal point and SEO copy. The slug is locked after first publication so existing public links
remain stable.

Creation and editing share image controls, including descriptions, focal coordinates and sample card
and tall crops. The editor provides a sticky save/discard bar and a warning before following an
in-app link with unsaved changes. Image crops still need a final check on the public page at the intended
screen sizes. A complete authenticated public-layout draft preview is not yet implemented.

Use **Formats** sparingly. Updating a format changes defaults for newly created events; it does not
silently rewrite existing dates or bookings.

## Venue rooms

Contentful holds venue copy only. In **Venue rooms**, expand the venue that needs work, then configure
the real physical inventory once:

- A fixed twin can sell individual shared places when appropriate.
- A convertible double/twin is one room, not two stocks.
- A two-person private booking chooses either one double bed or two single beds at checkout.
- The preference is visible in the grouped booking and room views; staff still assign the physical room.

Changing room groups affects future event setup. Existing bookings and allocations must never be
silently moved.

## Manage a live event

- **Overview** leads with confirmed people, booking groups, incomplete registration, capacity and
  outstanding balances. Setup pricing is not the main live view.
- **Attendees & bookings** shows every place. One purchaser booking for two people appears as one group
  with two attendee records, each with their own registration/account status.
- **Rooms** appears only for residential retreats and shows room occupancy, party grouping, bed
  preference and assignment.
- **Live session** appears only for live online events.
- **Payments** is booking-level and shows captured/outstanding totals, instalments, gifts and refunds.
- **Setup** holds prices, extras and publishing controls after launch.

**More actions → Cancel event** loads a server-calculated booking/guest/gift and refund summary.
Confirmation requires a reason and checks that the displayed impact has not changed. Cancellation
starts refunds and notifications; it does not promise every refund has already succeeded. Existing
early-bird deadlines are optional, collapsed setup controls.

Each attendee must complete their own registration from their verified account. The purchaser can see
whether their guest is complete, but cannot see or change the guest's private health answers. Staff can
send an explicit invitation/reminder; migrations never email old bookings automatically.

## Public listing and deep links

`/retreats` renders one card per open dated event, not one card per reusable page. A card links to
`/retreats/[slug]?date=[date-id]`, so its displayed price, date and location remain selected on the detail
and checkout journey. The image uses stored alt text and focal coordinates at every card crop.

## Contentful migration runbook

1. Apply the reviewed additive database migrations, including
   `20260909110000_retreat_experiences_and_formats` and `20260911100000_retreat_import_provenance`,
   before running the importer. Back up the affected records first.
2. Set Contentful and database environment variables for the same environment.
3. Run `pnpm run retreats:import-contentful` and review every slug, format, publish state and hash.
4. Resolve reported provenance/source/slug conflicts explicitly before running
   `pnpm run retreats:import-contentful -- --apply`. The command does not automatically repair
   previously imported records.
5. In the app, check the list and detail page for every live slug, including schedule Markdown, image
   crop, venue and each date deep link.
6. Create new content only in Event Pages. Keep the Contentful fallback through at least one observed
   production release; retire legacy entries in a later, separately approved cleanup.

The importer matches Contentful identity and verified space/environment/locale provenance before slug.
Unchanged imports perform no writes. Changed sources, unknown provenance and unrelated slug matches
are conflicts, not permission to overwrite app-owned content. Draft and published snapshots are read
separately; the current draft must never substitute for published content. No reviewed-update/repair
command is implemented yet. Contentful data is preserved and the importer never opens bookings.

## Deployment and verification

- Remote database migrations are deployed manually with the environment-specific scripts. Never use
  `prisma db push` on staging or production.
- Schema changes are additive. Additive schema compatibility alone does not establish that old
  newsletter workers can safely operate alongside the new attempt-lease protocol; see the recovery
  rollout notes before release.
- Run `pnpm run typecheck`, `pnpm run lint`, focused unit tests and the retreat Playwright journey.
- The two-guest regression at `tests/e2e/app/retreats/registration-operations.spec.ts` must show both
  people, their shared booking group and each registration state without exposing health answers.
