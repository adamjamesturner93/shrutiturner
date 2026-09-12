# Publication email editing

Blog Post now has two optional fields:

- **Publication email subject:** leave blank to use `New blog post: [title]`.
- **Publication email introduction:** plain-text paragraphs before the article excerpt/card. Leave blank to keep the existing introduction. The email adds `Hi [first name],` and the existing closing automatically, so enter only the introduction here. `{name}` and `{{firstName}}` are supported for personalisation within either field.

The introduction is rendered as escaped text, not HTML. Existing posts need no changes. Campaign retries retain their original frozen content; editing or republishing a post does not resend an already processed campaign.

## Applied on 12 September 2026

The sandbox Blog Post schema has both optional fields. No blog entries were modified or republished. The active newsletter guide and default signup entry have the requested new copy saved as drafts, preserving their other fields and locales. Review the existing draft edits before publishing these entries. The guide download points to the existing `/guides/rebuild-your-strength.pdf`.

Production Contentful has not been changed. The renderer code must be deployed before the new fields affect outgoing emails.

## Repeatable targeted update

`CONTENTFUL_ENVIRONMENT=sandbox node --experimental-strip-types contentful/scripts/update-newsletter-and-blog-email.ts`

This is a read-only preview. Add `--apply` to add missing optional schema fields and save newsletter drafts. It preserves other schema fields, refuses incompatible existing fields or unpublished schema changes, uses version checks, and never publishes content entries. Do not use the broad model migration merely to add these two fields.
