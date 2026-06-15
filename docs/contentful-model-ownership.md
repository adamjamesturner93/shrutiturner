# Contentful Model Ownership

Contentful is for business-owner editable marketing, editorial, and newsletter content.

## Retained in Contentful

- `authorProfile`
- `blogPost`
- `classDefinition`
- `faqItem`
- `instructorProfile`
- `leadMagnet`
- `newsletterSignupContent`
- `newsletterTemplate`
- `retreatTemplate`
- `retreatVenue`
- `smallGroupProgramme`
- `testimonial`

## Managed outside Contentful

- Legal documents are repo-controlled for reviewable compliance history.
- Global site shell settings stay in code/platform settings.
- Transactional email templates stay as React email components in code.
- Retreat instances, dates, pricing, and availability stay in operational app data.
- Trust badges, contact blocks, announcement banners, and themed week promos are not active CMS surfaces.

## Retired type pruning

The migration no longer creates retired content types, but Contentful does not delete old content types
automatically. Use the retired-type prune script after confirming the reset space has no entries for
those types.

Dry run:

```bash
pnpm run contentful:prune:retired
```

Delete mode:

```bash
CONTENTFUL_PRUNE_CONFIRM=delete-retired-types pnpm run contentful:prune:retired
```

The script refuses to delete any retired type that still has entries.
