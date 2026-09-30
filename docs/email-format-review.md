# Email format and structure review

## Scope

Reviewed the 51 existing email template files and programme notifications, including transactional, marketing, account/security and staff messages. Programme notifications now use a new shared-layout template. Rendering fixtures cover all 52 template files plus 11 variants, including the separately exported retreat cancellation admin message.

## Shared structure

- Branded plum header, white logo and green accent.
- PNG logo generated from the existing SVG, at three times its displayed width; no external font dependency. System fonts provide the existing serif/body hierarchy when brand fonts are unavailable.
- One semantic primary heading per email, supporting headings, readable paragraphs and prominent task-specific actions where appropriate.
- English document language, inbox preview text, responsive content spacing and readable footer links.
- Marketing unsubscribe footer remains distinct from transactional messages. Existing marketing categories, delivery recipients and commercial logic are unchanged.
- “My Studio” naming replaces remaining “Private Studio” references in email templates.
- Programme jobs render HTML and plain text from the same branded content. Human-readable subjects replace internal kind names; staff decisions and cancellation/refund messages omit participant setup/calendar links. Existing delivery IDs, recipient ownership and suppression checks remain in place.
- Referral reward, retreat summary and welcome label contrast increased; calendar/setup links are visibly underlined; newsletter content headings have semantic heading tags.

## Repeatable checks

```sh
pnpm exec vitest run tests/unit/shared tests/unit/admin/email-delivery-service.test.ts tests/unit/admin/member-email-route.test.ts tests/unit/programmes
pnpm exec playwright test -c playwright.emails.config.ts
pnpm run typecheck
pnpm run lint
```

The standalone Playwright configuration renders synthetic templates through Vitest, checks them at 390px and 800px, tests horizontal overflow and runs axe WCAG checks. It saves representative screenshots under `test-results`. It does not start the application, use a database, contact Postmark or send email; external image requests are blocked and the brand logo is served from disk.

These checks cover HTML rendering and browser accessibility, not the proprietary rendering engines in Outlook, Gmail or Apple Mail. Inbox previews in those clients remain a release check. The new logo asset must deploy with the templates; already queued messages retain their original stored HTML and are not rewritten or resent.
