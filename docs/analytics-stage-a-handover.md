# Stage A handover — final refinements

> **Stage A closure / Stage B update:** The owner approved A-06 exactly. Its replacement duration cell is now implemented, retaining the Google cookie configuration. Both desktop/mobile real-tag checks pass against that disclosure (fixed `_ga`, stream cookie up to 180 days from latest update); all collection was blocked. Historical blocker statements below describe the earlier A-05 review and are superseded. See [Stage B handover](stage-b-handover.md) for current release checks. No deployment or GA account verification has occurred.

18 October 2026. Checkpoint 2 was approved subject to final refinements. See [final refinement handover](analytics-stage-a-refinements.md) for attribution, receipt safeguards, policy verification and release blockers. No deployment, GA account changes, production data writes, commits or Stage B work were performed. The pre-existing staged changes remain staged; analytics changes are unstaged and separately reviewable with `git diff` (plus the new files below).

**Latest status (19 October 2026):** A-05 is implemented but publication is blocked by a real Google-cookie expiry mismatch. See [A-05 verification](analytics-a05-verification.md) for the authoritative latest results.

## Implementation

- Removed the unconditional Google tag. A single typed analytics module targets `G-PT4XP6G7CF`.
- Basic Consent Mode v2: no Google script or request before affirmative consent. The four consent signals start denied; only analytics storage becomes granted. Advertising storage, user data and personalisation remain denied, with Google Signals and advertising personalisation disabled in tag configuration.
- Loading requires production Node and Vercel environments, the exact `shrutiturner.co.uk` hostname, an eligible public route, consent, a non-holding site and a valid policy release date. Localhost, tunnels, previews, staging, admin, authentication and private account routes cannot enable collection.
- The approved consent invitation and persistent footer preferences use existing UI primitives. Rejection/withdrawal destroys the analytics browsing context, stops queued collection and clears accessible GA cookies. Preferences persist for 180 days; storage failure fails closed.
- Google executes inside an empty, hidden same-origin browsing context. It cannot automatically inspect the parent page's forms or URLs. Destroying that context removes its timers and listeners on withdrawal and route changes. Explicit events carry canonical public paths without query strings or fragments. This isolation is deliberate and requires final real-tag production verification.
- Manual page views follow pathname navigation, not accordions, query changes or cosmetic state. `send_page_view` is disabled. Only resolved public article/event components register dynamic paths.
- Vercel Analytics, Speed Insights, booking rules, payment handling, authentication and event visibility remain in place.

The previous platform GA setting and `GA4_MEASUREMENT_ID` no longer load a tag. The approved measurement ID is centralised in `src/lib/analytics/contracts.ts`; there is no competing tag or GTM installation.

## Event inventory

Every event is consent/route/environment gated. Common context is a query-free canonical page URL and public page title. No form values, contact details, medical information, raw session tokens or customer identifiers are included.

| Event                      | Trigger / components                                                                                          | Parameters                                                                                                                                     | Key event? | Test                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `page_view`                | Eligible pathname navigation, analytics provider                                                              | `page_location`, `page_title`, sanitised internal `page_referrer`                                                                              | No         | Accept; navigate; change query/open accordion; inspect one view per navigation                                |
| `coaching_cta_click`       | Existing enquiry link click, delegated provider listener                                                      | `service_type`, `cta_location`, optional enum `plan_interest`                                                                                  | No         | Click hero, plan and navigation enquiry links                                                                 |
| `generate_lead`            | Successful validated enquiry API response, coaching enquiry view; honeypot excluded                           | `service_type`, `form_location`, optional `plan_interest`                                                                                      | **Yes**    | Successful submission once; failed/invalid/honeypot responses emit none                                       |
| `room_selected`            | User selects a valid available residential option, detail/checkout views                                      | Public event slug `event_id`, `event_type`, `room_category`, `occupancy`                                                                       | No         | Change valid room; inspect category and guest count; workshop tickets emit no room event                      |
| `begin_checkout`           | Successful initial Stripe session creation, immediately before checkout redirect                              | `event_id`, `event_type`, `currency`, actual session `value` when known                                                                        | No         | Successful mocked session creation; failed creation emits none                                                |
| `purchase`                 | Server retrieves a paid, complete initial Stripe session matching the stored session; success page projection | Hashed `transaction_id`, GBP `currency`, actual collected `value`, `payment_type`, `items` with public `item_id`, category, price and quantity | **Yes**    | Verified paid deposit/full payment; refresh dedupes; failed/unpaid/cancelled/later balance sessions emit none |
| `sign_up`                  | Valid newsletter double opt-in creates a signed short-lived receipt, consumed on return to home               | Allowlisted `signup_location`, `signup_type=newsletter`                                                                                        | **Yes**    | Verify valid one-use token with analytics consent; unsigned success URL/form submit emits none                |
| `guide_delivery_initiated` | Same verified receipt also confirms Postmark accepted guide-email dispatch                                    | `signup_location`, `guide_id`, `delivery_method=email`                                                                                         | No         | Guide dispatch accepted emits once; skipped/failed dispatch emits none                                        |

`guide_delivery_initiated` means delivery genuinely initiated, not proof of opening an email or downloading a file. No `form_start` was added. Initial newsletter submissions and already-subscribed responses are not conversions.

Purchase items represent the initial amount collected for one booking, not the full future booking value. Deposits are identified separately from full payments; later balances are excluded. Zero-value orders do not create paid purchase events. Stripe session IDs are hashed before reaching analytics; guest identities and raw bearer session references never enter GA payloads.

## Consent, policy and storage verification

| Approved copy | Implementation match                                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-01          | Exact heading, invitation, accept/reject buttons and policy link implemented. No pre-consent Google loading.                                                                                                                  |
| A-02          | Exact amended description, heading, toggle and buttons implemented. Footer reopens preferences; withdrawal stops future collection. No promise of retrospective deletion.                                                     |
| A-03          | Exact approved addition is appended to the existing cookie policy in its appropriate section when the publication-date gate is enabled. Existing policy text is retained.                                                     |
| A-04          | Exact approved addition is added to the existing privacy policy under the same release gate. Events omit the listed identifying/sensitive fields. Existing provider, rights, retention and transfer disclosures are retained. |

Set `ANALYTICS_POLICY_EFFECTIVE_DATE=YYYY-MM-DD` to the **actual approved publication date** during release preparation. Until this valid date is configured, production GA remains disabled and the policy additions are not rendered. On publication, the effective date changes and the existing policy version gains `+analytics-YYYY-MM-DD`. No CMS document was overwritten and no arbitrary effective date was published.

Storage introduced: consent choice in localStorage and first-party `st_analytics` cookie (180 days); GA cookies configured for 180 days with `cookie_update: false` (real-tag testing nevertheless found the stream cookie refreshes expiry); optional plan interest in sessionStorage (30 minutes); signed HttpOnly newsletter receipt (10 minutes, consumed and cleared); browser event-deduplication markers valid for 180 days from the event, removed on expiry cleanup or withdrawal. Enquiry IDs are used only in an in-memory deduplication set and never sent to Google.

**Owner factual/account verification remains necessary:** confirm Google contractual/processor terms and international transfer arrangements, account-level retention and advertising settings. A-01–A-04 are fully approved. A-05 is approved with amendments and implemented; its Google-cookie duration claim remains factually blocked. A-06 proposes an accurate alternative and is not approved. Existing policy prose is preserved rather than silently corrected. Repository checks cannot establish legal sufficiency or the real GA account configuration. Any further policy wording needs explicit editorial approval.

## Automated validation

- 155 targeted Vitest tests across 20 files passed: analytics contracts, route/environment exclusions, receipts and tampering, verified newsletter/guide outcomes, enquiry success/failure, checkout and payment projections, deduplication, safe campaign attribution, policy preservation, authentication logic, room/inventory logic and payment calculations.
- 14 Playwright tests passed across desktop and 390px mobile: no-consent/rejected/accepted/withdrawn states, route changes, safe URLs/referrers, Instagram/newsletter attribution, deduplication and local preference persistence. Production-host behaviour uses intercepted HTML and a mocked Google script; no live GA traffic was generated.
- The real local preference dialog passed axe accessibility checks in both browser projects.
- Final typecheck passed. Lint passed with three pre-existing navigation warnings in `booking-modal.tsx` and `auth-context.tsx`, and no errors. `git diff --check` passed.
- Final webpack production build passed, including TypeScript checking and generation of 214 static pages. Default Turbopack encountered a worker-port permission failure in this environment; the webpack build uses the same application.
- No live purchase, customer-data test or real newsletter signup was used. Payment/email verification uses mocks, not live charges or email delivery.

Test commands:

```sh
pnpm exec vitest run tests/unit/analytics tests/unit/retreats/checkout-success.test.ts tests/unit/public/newsletter tests/unit/public/coaching/enquiries-route.test.ts tests/unit/public/retreat-checkout-route.test.ts
pnpm exec playwright test --config playwright.analytics.config.ts
pnpm run typecheck
pnpm run lint
pnpm exec next build --webpack
git diff --check
```

## Manual GA4 configuration

1. Confirm the web stream is `G-PT4XP6G7CF` for the canonical production domain. Do not install another tag or GTM container.
2. Disable enhanced measurement automatic page/history tracking and automatic form, outbound-link and file-download collection. Explicit application events are authoritative; the empty analytics frame intentionally does not measure parent-page scrolling or interactions.
3. Keep Google Signals, advertising integrations, user-provided-data collection and personalised advertising disabled. Review any existing linked advertising products.
4. Mark only `generate_lead`, `purchase` and `sign_up` as key events. Do not mark CTA clicks, room selections or checkout starts as business conversions.
5. Add event-scoped custom dimensions where reporting needs them: `service_type`, `cta_location`, `plan_interest`, `form_location`, `event_id`, `event_type`, `room_category`, `occupancy`, `payment_type`, `signup_location`, `signup_type`, `guide_id`, `delivery_method`. Standard ecommerce fields already have defined meanings. Do not register transaction IDs as custom dimensions.
6. Review property data retention and record the selected duration for policy review. This repository does not set or verify the account's retention setting.
7. Review unwanted referrals for Stripe checkout domains. No cross-domain linker or sensitive URL decoration is introduced. Confirm first-party client cookie continuity across checkout in production.

References: [Google basic consent implementation](https://developers.google.com/tag-platform/security/guides/consent), [GA4 configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views), [data retention controls](https://support.google.com/analytics/answer/7667196).

## Production verification checklist — after explicit release approval

- [ ] Review this Stage A diff independently of the pre-existing staged design changes; select the intended release scope.
- [ ] Complete owner policy/account checks and configure the actual publication date. Ensure AUTH_SECRET remains configured for signed receipts.
- [ ] Approve deployment separately; no deployment is part of this handover.
- [ ] In a fresh production browser, inspect Network: no Google requests before choice or after rejection. Accept and confirm a single Google tag with denied advertising signals.
- [ ] Verify footer preferences, persistence, withdrawal and private-route transitions. Confirm no new analytics requests after withdrawal (already in-flight requests cannot be recalled).
- [ ] Verify one page view per actual route navigation, no query/fragment/referrer leakage, and no events on admin, account/authentication, preview or development hosts.
- [ ] Using an authorised test identity/environment, verify one lead on success and none on failure; verify newsletter double opt-in and separately accepted guide dispatch.
- [ ] With an explicitly authorised payment test arrangement, verify initial full/deposit amounts, transaction deduplication, and no purchase for cancelled/failed/later-balance sessions. Do not make a real purchase merely to test analytics.
- [ ] Confirm real-tag collection, browser cookie continuity, Realtime/DebugView and Tag Assistant behaviour, including the isolated analytics context. These have **not** been verified against the GA account.
- [ ] Confirm Vercel Analytics/Speed Insights still report and compare performance before/after activation.

## Known limitations

Browser analytics is best effort. Ad blockers, consent denial, leaving before dispatch, clearing storage and not returning from Stripe or the confirmation email can cause missing conversions. Newsletter receipts require consent at verification; no historical actions are replayed after later consent. There is no server Measurement Protocol fallback.

Deduplication prevents repeated events within the available browser storage, with stable hashed purchase transaction IDs for GA ecommerce deduplication. It is not a global exactly-once guarantee across devices or cleared storage. Markers can be written before Google's network acknowledgement; an interrupted send may be lost rather than retried.

Final refinements add consent-only, strictly allowlisted UTM attribution through native campaign fields and fixed referring domains. Raw URLs and unrestricted parameters remain excluded. See the final refinement handover for the permitted vocabulary, persistence and acquisition-report verification requirements.

The isolated tag architecture limits automatic engagement diagnostics; explicit views and conversions are the intended measurements. Actual Google behaviour and cookie/session continuity must pass the production checks before claiming analytics works end to end. Code-level consent and payload tests are not a legal compliance certification.

## Files modified / added

Analytics runtime and UI:

- `src/lib/analytics/{contracts,client,conversions,purchase,receipt,policy,attribution}.ts`
- `src/components/analytics/{provider,page}.tsx`
- `src/app/api/analytics/receipt/route.ts`
- `src/app/layout.tsx`, `src/components/footer.tsx`, `.env.example`

Conversion hooks and approved policy rendering:

- `src/views/{coaching,coaching-enquire,retreat-detail,retreat-checkout,blog-post}.tsx`
- `src/lib/retreats/{service,checkout-success}.ts`
- `src/lib/newsletter/email-service.tsx`, `src/app/api/newsletter/verify/route.ts`
- `src/app/(public)/retreats/checkout/success/page.tsx`
- `src/app/(public)/{cookies,privacy}/page.tsx`

Tests and documentation:

- `playwright.analytics.config.ts`, `tests/e2e/analytics/consent.spec.ts`
- `tests/unit/analytics/{contracts,conversions,receipt-route,attribution}.test.ts`
- `tests/unit/public/newsletter/verify-route.test.ts`
- `docs/{analytics-stage-a-audit,analytics-stage-a-handover,analytics-stage-a-refinements,copy-change-register}.md`

## Release boundary

Stage B has not begun. Review the final refinements and release checklist before authorising deployment or dependent design work. No copy beyond approved A-01–A-04 was introduced. Measurement supports assessing enquiries, bookings and audience growth; no conversion increase is claimed.
