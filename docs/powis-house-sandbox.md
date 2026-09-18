# Powis House sandbox fixture

Run `pnpm run seed:powis-house` for a read-only preflight, then
`pnpm run seed:powis-house --apply` to seed. The script requires a local
`DATABASE_URL` and `CONTENTFUL_ENVIRONMENT=sandbox` and uses the Contentful
credentials in the local environment files.

The fixture restores the previous “Pause, Move, Breathe” retreat for
18–20 September 2026. Visit `/retreats/pause-move-breathe-stirling` locally.
Its original early-bird deadline (14 August) and balance deadline (24 July)
have passed, so it exercises standard prices and the late-booking payment path.
The hero image is the existing Shruti coaching image, not a venue photograph.

- Contentful: the existing `powis-house` venue, a published retreat template
  and three linked schedule days.
- Database: the linked venue profile, three twin room templates, two king room
  templates, an open retreat date, two inventory pools, five room units and
  three rates (£425 shared, £525 private for one, £910 private for two).
- Payment configuration: the original 20% deposit rule and balance due 56 days
  before arrival.

The script fills missing CMS fields and creates missing database records;
rerunning it preserves existing field values, prices, availability and bookings.
It publishes the targeted Powis House entries in sandbox. This fixture is
separate from the default catalogue seed.

Atmosphere is edited under **Retreat Template → Atmosphere**
(`atmosphereDescription`). The seed adds this optional field to the sandbox
model and populates it for Powis House and The Middle Ground. Blank atmosphere
fields hide that card. Full Description and Atmosphere support the site's
Markdown formatting: paragraphs, headings, lists, bold, italic, code and links.

Convertible private rooms offer a double/twin choice for two guests. This uses
the room group's app-managed bed setup, and keeps one physical room and the same
two-guest rate for either arrangement. The choice is saved for normal and gift
bookings and appears in the admin booking list/export and booking confirmation.
The additive migration `20260908211500_retreat_bed_preferences` must be applied
with the environment-specific migration script before deploying this code to a
remote environment. Existing date options are linked to an unambiguous venue
room group; unmatched legacy options retain their current behaviour.

Run the optional seeded browser check with:

```sh
POWIS_HOUSE_SEEDED=1 pnpm exec playwright test tests/e2e/public/retreats/powis-house.spec.ts
```

## Current local booking-review fixtures (September 2026)

For the current database-owned demo, use:

```sh
node --env-file=.env --experimental-strip-types scripts/seed-local-booking-review.ts
```

This requires a localhost database and a Stripe test key. It writes no Contentful content.
It corrects The Middle Ground (4 October 2026) and Pause & Restore (13 December 2026)
to online workshops, creates missing ticket inventory, and preserves existing bookings.
It adds one Rebuilding Your Strength January 2027 programme (£125, 12 places) via the
programme demo seed's `--only=demo-rebuilding-your-strength` option.

The new retreat is `/retreats/powis-house-weekend`, 11–13 June 2027. Dates, prices and
inclusions are mock data. Shared places cost £450; private rooms cost £600 for one or £900
for two, with a 20% deposit and balance due 56 days before arrival.

The screenshot's room setup is represented by four venue groups and five physical rooms:

- Green: fixed king, private bathroom; private bookings for one or two only.
- Grey and Yellow: convertible king/twin, private bathroom; shared or private bookings.
- Beige: fixed twin, shared bathroom; shared or private bookings.
- Blue: convertible king/twin, shared bathroom; shared or private bookings.

All rooms sleep two. Shared/private selling options use the same group inventory pool,
so the retreat has ten physical places, not the sum of independently advertised options.
Old venue groups are deactivated. Re-running does not rebuild the retreat's inventory or
reset bookings. The older Contentful seed above remains a separate legacy fixture and
should not be used to recreate this setup.
