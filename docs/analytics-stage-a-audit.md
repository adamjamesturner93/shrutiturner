# Analytics audit and Stage A proposal

Date: 18 October 2026. Status: **Checkpoint 2 approved; final Stage A refinements implemented, awaiting production approval.**

The findings and proposal below preserve the pre-implementation audit. See [Stage A handover](analytics-stage-a-handover.md) for the final implementation, deviations, tests and release requirements.

This records the original audit and implementation proposal, not a claim that GA4 is configured or collecting correctly. No deployment or production mutation has been performed. Existing staged coaching/design changes are a pre-existing baseline and remain untouched by this audit.

## Verified architecture

- Next.js 16.4.2 App Router, React 19, TypeScript; routes in `src/app`, page views in `src/views`.
- Auth.js v5; Prisma 7/PostgreSQL; Stripe payments; Postmark email; Contentful plus application-owned published retreat experience content.
- Shared design: `src/components/marketing/sections.tsx`, existing shadcn/Radix UI, `src/styles`, `Layout`, shared images and forms.
- Root layout loads Vercel Analytics and Speed Insights. Preserve both.
- GA currently reads `platformSettings.gaMeasurementId` or `GA4_MEASUREMENT_ID`. Reuse this configuration boundary rather than create competing tags/configuration. Target ID: `G-PT4XP6G7CF`. Do not expose other environment values to clients.
- Unit/integration coverage uses Vitest; browser journeys and axe checks use Playwright. Required checks include typecheck, lint, focused tests and production build.

## Findings and risks

| Area                 | Repository evidence                                             | Finding / consequence                                                                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GA installation      | `src/app/layout.tsx`                                            | Global lazy-loaded tag/config with no consent, production-host or route gate. Configuration can load GA on private routes and non-production hosts. Existing config enables automatic page measurement.                                                                    |
| Consent              | Root, providers, components, cookie page                        | No analytics preference UI/store found. Newsletter/health consent is unrelated and must never be reused for analytics.                                                                                                                                                     |
| Published policies   | `/cookies`, `/privacy`, CMS-backed legal pages                  | Broad analytics/provider disclosures exist; cookie controls are mentioned, but no suitable analytics controls were found. Additions require editorial/legal review. Do not replace existing policy prose.                                                                  |
| Sensitive data       | Checkout success and login URLs                                 | Success URL carries `session_id`; login links can carry email and redirect paths. Never pass raw URL, referrer, search params, form data or DOM text into analytics.                                                                                                       |
| Coaching             | `src/views/coaching-enquire.tsx`, `/api/coaching/enquiries`     | Success follows validated server submission. The endpoint returns an application ID; use success to trigger a lead but never send that ID or free-text answers to GA.                                                                                                      |
| Newsletter           | `/api/newsletter/subscribe`, `/api/newsletter/verify`           | Double opt-in. Form success is pending; already subscribed is not a new subscription. Verified transition is the conversion. `?verified=success` alone is not proof.                                                                                                       |
| Guide                | newsletter verify and email service                             | Guide email is initiated after verification and can fail independently. Emit only after verified delivery initiation, not page load or subscription attempt.                                                                                                               |
| Booking              | `src/views/retreat-checkout.tsx`, `src/lib/retreats/service.ts` | Stripe Checkout starts after validated session creation. Attach analytics after successful creation, never alter quotes, deposits, inventory or payment rules.                                                                                                             |
| Payment confirmation | `src/lib/retreats/checkout-success.ts`                          | Server retrieves Stripe session and checks stored session association. Existing paid-state and exact Stripe amount support a restricted analytics projection. Later balance/instalment payments must be excluded from new-booking purchase events.                         |
| Event visibility     | `listOperationalRetreats`, experience service                   | Published application content/legacy published CMS content joined to operational dates with open/sold-out status, booking windows and end dates. Preserve this logic and legitimate local fixtures.                                                                        |
| SEO                  | `src/app/sitemap.ts`, `robots.ts`, content metadata             | Existing canonical/metadata/sitemap helpers. Sitemap uses operational events. Private routes are disallowed in robots; noindex coverage needs Stage C audit. `/subscribe` is absent from static sitemap list. No metadata wording changes proposed for implementation now. |

Production tag loading, actual GA property settings and live event receipt have **not** been verified. Source inspection identifies potential exposure, not proof of deployed transmission.

## Stage A implementation plan

1. Replace the root's unconditional GA scripts with a small typed analytics runtime. Keep Vercel integrations unchanged.
2. Require production deployment **and** exact production hostname, plus affirmative consent and an approved public route. Unknown routes fail closed. Exclude admin, dashboard, account, authentication, API, email, redemption and token-bearing routes. Safely normalise checkout confirmation separately.
3. Build an accessible first-party preference interface with existing UI primitives, only after the exact text in the copy register is approved. Persist a versioned choice; storage errors fail closed. Provide a permanent preference control and same-page/cross-tab updates.
4. Basic Consent Mode v2: queue restrictive defaults locally, but do not request Google's tag until analytics consent. Keep all three advertising signals denied; enable only analytics storage. No advertising integrations/Signals/user IDs.
5. Explicit page views with automatic config page views disabled. Disable overlapping Enhanced Measurement features in the GA property as a release prerequisite. Track committed pathname navigation, not hashes, accordion state or query-only cosmetic updates. Use safe titles and canonical paths; omit query/hash and sanitise referrers. No retrospective replay of pre-consent events.
6. On withdrawal, disable collection immediately, cancel queued sends, clear analytics cookies where accessible and update consent. Test that already-loaded tag timers cannot transmit afterwards. Sensitive route transitions require equivalent shutdown; removing a script alone is insufficient. Use a clean document boundary where necessary without interrupting form submission or payments.
7. Integrate allowlisted event helpers at successful actions. All analytics failures are non-blocking. No payload spread from application, form, Stripe or CMS objects.
8. Purchase projection contains only an opaque non-bearer transaction reference, published event identifier/type, currency, actual collected amount, item and payment type. No checkout session token, booking/customer ID, names or room names tied to people. Deduplicate with a persistent first-party receipt marker and GA transaction ID. No second purchase for balance payments. Document browser storage/cross-device and no-return limitations rather than claiming exact-once delivery.
9. Newsletter verification produces a short-lived signed first-party conversion receipt with only allowlisted metadata and delivery outcome. Validate/consume it before client emission; never trust the success query. Emit only with current analytics consent; do not infer consent from email marketing opt-in. No server Measurement Protocol fallback. If safe receipt bridging proves unsuitable, explicitly leave verified signup/delivery tracking limited rather than count pending signups.
10. Add unit and browser tests using intercepted Google requests/mock transports. No real GA on localhost/staging, real purchases, real messages or production customer data. Deliver handover and stop for Stage A review before Stage B.

### Expected implementation files

- `src/app/layout.tsx`, analytics configuration boundary and a new `src/lib/analytics` module.
- New consent/provider UI using existing components; shared footer preference entry.
- `src/views/coaching.tsx`, coaching enquiry success handler and relevant existing coaching CTA components.
- Retreat selection/checkout views and a narrow server-verified confirmation projection.
- Newsletter verification and a validated receipt reader; existing subscription/delivery business behaviour unchanged.
- Focused Vitest/Playwright coverage; GA setup and test documentation.

Keep Stage A changes separately reviewable from the already staged redesign. Do not commit unrelated staged files or push/deploy as part of this work.

## Proposed event inventory

| Event                      | Trigger                                              | Allowlisted parameters                                                          | Classification        | Verification                                                                     |
| -------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------- |
| `page_view`                | Permitted committed navigation after consent         | sanitised page_location, page_title, page_referrer                              | Diagnostic            | Initial render, client navigation, Back/Forward; no query/hash duplicates        |
| `coaching_cta_click`       | Existing enquiry CTA selected                        | cta_location, service_type=coaching, optional structured plan_interest          | Diagnostic            | Hero/plan/final CTA; no free-text plan inference                                 |
| `generate_lead`            | Server-confirmed coaching enquiry                    | service_type=coaching, form_location, optional structured plan_interest         | Recommended key event | Success once; validation/500/retry failures emit none                            |
| `room_selected`            | Explicit valid accommodation selection               | published event_id, event_type=retreat, enum room_category, occupancy           | Diagnostic            | Valid selections only; not hydration, online tickets or unavailable options      |
| `begin_checkout`           | Valid payment session created, before redirect       | event_id, event_type, currency, actual initial amount when verified             | Diagnostic            | Failed session creation emits none; never delay payment navigation for analytics |
| `purchase`                 | Server-verified successful initial payment           | opaque transaction_id, currency, actual value, items; payment_type=deposit/full | Recommended key event | Paid vs unpaid/cancelled; exact deposit value; replay dedupe; balance excluded   |
| `sign_up`                  | Newly verified newsletter subscription               | signup_location, signup_type=newsletter                                         | Recommended key event | Pending/already subscribed/invalid token emit none; valid receipt emits once     |
| `guide_delivery_initiated` | Guide delivery genuinely initiated, verified receipt | guide_id, signup_location, delivery_method=email                                | Secondary diagnostic  | Failed delivery emits none; no extra sign_up for guide delivery                  |

Do not add automatic form_start in this stage. Newsletter location uses existing structured source values; do not infer values from submitted text. Event enums distinguish workshops from retreats independently of online/in-person delivery.

## Validation and owner handover

Automate:

- No Google script/request for no consent, reject, local, ngrok, preview, staging, private or unknown routes.
- Accept, reload, change, revoke, multi-tab changes, repeated accept and blocked storage.
- Revocation with pending script load/events and public-to-private navigation after the tag was loaded.
- Exact manual page-view count, updated title, sanitised URL/referrer, no personal values in outbound payloads.
- Lead success/failure; newsletter verification and delivery failure; room selection; checkout failure/cancel; verified purchase/deposit/deduplication/balance exclusion.
- Accessible consent controls, focus, keyboard, responsive layout; regressions in existing booking and authentication tests.
- Typecheck, lint, relevant unit/integration/e2e tests and production build before Stage A completion.

Manual before release:

- Confirm GA property ownership and web stream ID `G-PT4XP6G7CF`.
- Disable duplicate enhanced page/history and automatic form/outbound tracking. Disable Google Signals and advertising/personalisation integrations.
- Review data retention and provider disclosures; no unsupported legal assurance is inferred from code.
- Create event-scoped dimensions only for reporting fields needed: service_type, plan_interest, cta_location, form_location, event_type, room_category, occupancy, signup_location, signup_type, payment_type, delivery_method. Avoid high-cardinality custom dimensions for transaction/event IDs already available in ecommerce reporting.
- Mark only generate_lead, purchase and sign_up as key events.
- Configure Stripe as an unwanted referral where appropriate; do not forward authentication/payment identifiers or enable cross-domain URL decoration to Stripe.
- After explicitly approved deployment, verify consent/no-consent network behaviour and permitted events in Tag Assistant/Realtime/DebugView. Production purchase checks need a separately authorised safe payment scenario. Never claim live verification based on mocked tests.

## Deferred stages / retained requests

Stage B follows Stage A owner review. Preserve exact existing copy; publish a page-by-page Copy Change Register before any dependent redesign. Review coaching, retreats, retreat detail and checkout skeletons; move “Where you’ll stay” below “Daily rhythm” in content and navigation order. Preserve existing booking behaviour and all commercial terms. Existing workshop fixture browser verification has an unresolved content assertion from earlier work and must be resolved before reporting that UI work fully validated.

Stages C/D/E follow with technical SEO, responsive/accessibility/performance checks and final release approval. No automatic deployment.

## References

- Google consent implementation: https://developers.google.com/tag-platform/security/guides/consent
- Manual page views: https://developers.google.com/analytics/devguides/collection/ga4/views
- Published cookie/privacy pages: https://shrutiturner.co.uk/cookies and https://shrutiturner.co.uk/privacy
