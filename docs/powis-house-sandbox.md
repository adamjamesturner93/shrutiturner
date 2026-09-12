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
