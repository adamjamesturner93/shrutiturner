# Content ownership

The app is the operational source of truth. Contentful is reserved for reusable editorial content
that benefits from a general-purpose CMS.

## Contentful owns

- `authorProfile`, `blogPost` and `testimonial`
- `classDefinition`, `smallGroupProgramme` and `instructorProfile`
- `leadMagnet`, `newsletterSignupContent` and `newsletterTemplate`
- `faqItem`
- `retreatVenue`: the venue story, address, travel, facilities and accessibility copy

Venue room names, bed setups, physical capacity and selling rules are not venue editorial content.
They are configured once in **Admin → Retreats and workshops → Venue rooms**.

## The app owns

- Event formats and their safe operational defaults
- Reusable Event Pages, including story, photography, focal point, atmosphere and the schedule
- Event dates, capacity, prices, payment rules, extras and booking availability
- Venue room inventory and bed/selling configurations
- Bookings, grouped guests, attendee registration and health context
- Member, coaching, billing and email-delivery operational records
- Legal documents and transactional React email templates

The Event Page schedule is one Markdown textbox. This replaces the nested
`retreatScheduleDay` editing journey while retaining headings, lists and paragraphs.

## Legacy retreat content during migration

`retreatTemplate` and `retreatScheduleDay` are transition-only Contentful models. Public reads use a
published app Event Page first and only fall back to the legacy Contentful template when an event has
not yet been migrated. Do not make new retreat templates in Contentful.

The import is deliberately non-destructive:

```bash
# Reports what would be imported; makes no database changes.
pnpm run retreats:import-contentful

# Creates/updates app Event Pages and links matching dates.
pnpm run retreats:import-contentful -- --apply
```

The importer records the Contentful entry ID, locale and content hash for traceability. It converts
linked schedule-day entries—or the older structured schedule fallback—into Markdown. It does not
delete, unpublish or edit Contentful entries. Keep the fallback until every live slug has been checked
in the app and the deployment has been observed in production.

## Newsletter boundary

Contentful owns the issue body and subject. The database owns the send. The first eligible publish
freezes the content and recipient set; republishing the same issue cannot send a second campaign.
Retries use the frozen recipient payload and suppress anyone who has since unsubscribed. An ambiguous
Postmark batch outcome must be reconciled in the admin campaign screen before any retry is possible.

## Retired type pruning

The normal migration does not delete content types. Use the retired-type prune command only after
checking that a retired type has no entries:

```bash
pnpm run contentful:prune:retired
CONTENTFUL_PRUNE_CONFIRM=delete-retired-types pnpm run contentful:prune:retired
```

The command refuses to delete a retired type that still contains entries.
