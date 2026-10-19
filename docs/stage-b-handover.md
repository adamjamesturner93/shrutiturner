# Combined website optimisation handover

19 October 2026. Local implementation only. No deployment, commit, push, staging changes or analytics publication date configuration. Existing staged and unstaged work was preserved.

## Implementation by page

| Page / component | Completed changes                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homepage         | B-01 two photographic service pathways replace the standalone retreat promotion, between the existing situations and approach sections. Preserved hero, diagram, visible explanation, introduction, testimonials and final CTA. Compact mobile crops and natural video ratio retained.                                           |
| About            | B-02 understated transition and links follow the three perspectives. Preserved story, qualifications, video and final CTA; retained improved reading width and mobile photograph.                                                                                                                                                |
| Coaching         | B-04 concise trust section with authentic photograph follows benefits. Process, Included, plans and Everfit retain the agreed order. B-07 metadata title applied. Prices, entitlements and enquiry links preserved.                                                                                                              |
| Retreats         | B-03 compact Next Up selects the earliest future, published, open-window event with available accommodation/tickets. Uses existing public projection and real prices, dates, location and capacity; absent when none is eligible. Existing categories, cards and copy retained. Currency formatting preserves fractional prices. |
| Retreat detail   | B-05 paragraph added to the existing host card. Daily Rhythm remains before accommodation/gallery/travel with matching navigation. Booking sidebar, sticky CTA and room/payment logic preserved.                                                                                                                                 |
| Newsletter       | Exact B-06 invitation and CTA on subscribe and shared invitation surfaces, including footer/popup. Existing CMS consent and guide-specific content preserved; provider, double opt-in and guide delivery unchanged. Popup now uses the existing Radix dialog for focus containment, Escape and screen-reader semantics.          |
| Shared UI        | Existing mobile navigation wrapping/viewport scrolling and 44px toggle retained. Dedicated coaching, retreat index/detail and checkout skeletons retained; reduced-motion handling preserved.                                                                                                                                    |
| Policies         | Approved A-01–A-06 preserved. A-06 is implemented and its prior real-tag verification retained below. Publication remains gated by the authorised effective date.                                                                                                                                                                |

These changes clarify service discovery, provide a concise coaching trust introduction, make the next available experience easier to find and broaden the approved newsletter invitation. They support a cleaner measurable journey; no conversion increase is claimed.

## Copy approvals

[Copy Change Register](copy-change-register.md): **B-01–B-07 APPROVED — IMPLEMENTED**, exactly as supplied, including revised B-04 and B-06. A-01–A-06 remain approved. No additional wording proposals are pending. Existing commercial terms, FAQs, biography, benefits and testimonials are preserved.

## Technical SEO

- Subscribe is indexable and included in the sitemap; existing title/description retained, with matching social metadata.
- Retreat social metadata now includes an image; detail titles avoid a duplicate brand suffix and explicitly identify their canonical Open Graph URL.
- Event structured data uses the existing pricing helper, including tickets without rate plans, available room pricing, per-date online/venue facts and existing address fields. No invented reviews or ratings. Removed event start dates incorrectly used as sitemap modification dates.
- JSON-LD escapes script-breaking content without altering parsed values.
- Private application layout has noindex metadata. Response headers prevent indexing across non-production environments and cover private/transaction routes in production, even when child metadata overrides parent settings.
- Existing public URLs, production canonicals, Search Console verification and publication gates retained. Local development fixtures remain local records; production public selection still requires published templates and eligible dates.
- Search-result appearance is not guaranteed. Online events may not qualify for Google's event rich results; see [Google event requirements](https://developers.google.com/search/docs/appearance/structured-data/event). Validate production URLs in Search Console after release.

## Accessibility and performance

Representative browser checks cover 360, 390, 768, 1024 and 1440px: one H1, horizontal overflow, axe WCAG A/AA rules, diagram keyboard interaction, navigation, room selection and newsletter dialog focus/Escape. Contact/enquiry photography and workshop ticket presentation retain their regression coverage. Automated checks are not complete WCAG certification.

No new dependencies or third-party scripts. Correct image sizing hints and compact crops retained; remote fallback hero images now honour eager/high-priority loading instead of always loading lazily. Newsletter focus behaviour reuses an existing primitive. Vercel Analytics and Speed Insights remain intact. No new Lighthouse iteration or field Core Web Vitals claim; compare production mobile field data after release.

## Material files

- Presentation: `src/views/{home,about,coaching,retreats,retreat-detail,subscribe}.tsx`; `src/components/{header,footer,newsletter,retreat-navigation,public-loading}.tsx`; `src/components/marketing/wellbeing-venn.tsx`; shared Skeleton and ImageWithFallback.
- Discovery and copy: `src/lib/retreats/discovery.ts`, public projection in `service.ts`/content types, newsletter constants and signup-copy hook.
- SEO: public coaching/retreats/detail/subscribe route metadata, `src/app/sitemap.ts`, private layout, `next.config.mjs`, `src/lib/seo/structured-data.ts`, `src/components/json-ld.tsx`.
- Loading routes: coaching, retreats index/detail; checkout continues using updated shared loading component.
- Verification: `tests/e2e/stage-b/presentation.spec.ts`, `playwright.stage-b.config.ts`, discovery/SEO unit tests, existing analytics policy tests and A-06 real-tag test updates.
- Documentation: this handover, Copy Change Register and historical Stage A closure notices.

No schema, payment architecture, authentication or newsletter business logic changed in this completion pass. The public event projection adds an eligibility flag; live checkout still enforces existing rules independently.

## Consolidated validation

- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed with three pre-existing internal-navigation warnings in `booking-modal.tsx` and `auth-context.tsx`; no errors.
- Focused `pnpm exec vitest run`: **144 unit tests passed in 22 files** (analytics, newsletter/coaching routes, checkout confirmation, pricing/rooms, discovery, SEO and auth).
- `pnpm exec vitest run tests/integration/retreats/physical-inventory.integration.test.ts tests/integration/public/newsletter/journeys.integration.test.ts`: **10 passed** against verified local Postgres; Stripe and email mocked. Existing pg concurrent-query deprecation warning remains.
- `pnpm exec playwright test -c playwright.stage-b.config.ts --reporter=line`: **36 passed, 13 intentional viewport skips, 1 initial metadata failure**. The failure exposed a relative canonical inheriting the local ngrok host. Public retreats/detail/subscribe canonicals now explicitly use production URLs. The single affected metadata test then **passed**: final outcome **37 passed / 13 intentional skips**.
- `pnpm exec playwright test -c playwright.analytics.config.ts tests/e2e/analytics/consent.spec.ts --reporter=line`: **20 passed**, mocked/intercepted collection, covering consent, rejection, withdrawal, route gates, attribution and expiry.
- `pnpm exec playwright test -c playwright.coaching-ux.config.ts --grep 'legacy coaching application|photography|workshop|benefit' --reporter=line`: **8 passed**, including enquiry failure/retry/success, contact/enquiry accessibility and online workshop ticket terminology.
- Production webpack build initially exposed Next.js’s current-time prerender restriction in Next Up. Added a small cached server selector with the existing catalogue cache durations; no booking rules changed. `pnpm run build --webpack` then **passed**, including TypeScript and prerender generation; `/retreats` uses 60-second revalidation and a five-minute cache expiry. The changed route also passed targeted ESLint.
- `git diff --check`: passed.

The validation uses synthetic identities, local fixtures and mocks. No real payments, production bookings or live newsletter delivery were initiated. Unit checks cover verified initial payment/deposit/full amounts, balance exclusion and deduplication; real Stripe/GA reporting still requires the authorised production checks below. A-06's prior two real-tag offline tests remain historical evidence and were not needlessly repeated. No full-site crawl, Lighthouse series or exhaustive manual screen-reader audit was run.

## A-06 verification

The downloaded real `gtag.js` for `G-PT4XP6G7CF` was served unchanged in intercepted HTTPS-origin browser tests. No collection reached Google. Desktop and mobile both verified:

- No GA cookies before analytics consent.
- Only `_ga` and `_ga_PT4XP6G7CF`, initially approximately 180 days.
- `_ga` expiry unchanged on revisit; stream cookie expiry refreshed by approximately one second during this run and remained within 180 days of its latest update.
- Both cookies removed after withdrawal; rejected preference retained.

The policy now says exactly: “The `_ga` cookie expires up to 180 days after creation. The `_ga_PT4XP6G7CF` cookie expires up to 180 days after its latest update.” The Google settings remain `cookie_expires` 180 days and `cookie_update: false`. The disclosure follows observed behaviour, not an assumption that both cookies obey the latter setting identically.

## Analytics inventory (unchanged by Stage B)

| Event                      | Trigger / structured parameters                                                                                                         | Key event? |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `page_view`                | Genuine eligible navigation; safe `page_location`, `page_title`, `page_referrer`                                                        | No         |
| `coaching_cta_click`       | Coaching enquiry CTA; `service_type`, `cta_location`, optional `plan_interest`                                                          | No         |
| `generate_lead`            | Successful enquiry response; `service_type`, `form_location`, optional `plan_interest`                                                  | **Yes**    |
| `room_selected`            | Valid accommodation choice; `event_id`, `event_type`, `room_category`, `occupancy`                                                      | No         |
| `begin_checkout`           | Valid payment checkout starts; `event_id`, `event_type`, GBP `currency`, correct `value` when known                                     | No         |
| `purchase`                 | Server-verified initial Stripe payment only; hashed `transaction_id`, GBP `currency`, actual collected `value`, `payment_type`, `items` | **Yes**    |
| `sign_up`                  | Verified newsletter double opt-in receipt; `signup_location`, `signup_type`                                                             | **Yes**    |
| `guide_delivery_initiated` | Verified Postmark acceptance of guide email; `signup_location`, `guide_id`, `delivery_method`                                           | No         |

Attribution remains consent-only and uses strictly allowlisted UTM values and referring domains through Google's native campaign/referrer fields. It persists within the tab for 30 minutes from navigation. Arbitrary URLs, query parameters and referrer paths are not transmitted. Instagram/newsletter examples pass automated checks; native acquisition reports still require production verification.

The signed newsletter receipt is issued only when analytics consent permits and subscription verification succeeds. Newsletter confirmation and guide delivery work independently. Receipt lifetime is 10 minutes and it is removed when consumed. Refusal, device changes, expired receipts, blockers and leaving before dispatch can result in missing measurement. Guide events confirm email delivery initiation, not opening or downloading. Deduplication is browser-local for up to 180 days, not a cross-device exactly-once guarantee.

## Combined account configuration and release checklist

### Owner/account tasks — not verified by repository tests

- [ ] Confirm `G-PT4XP6G7CF` is the intended production stream; no second tag/GTM installation.
- [ ] Disable enhanced-measurement automatic page/history, form, outbound-link and file-download tracking; explicit application events are authoritative.
- [ ] Keep Google Signals, user-provided-data collection, advertising personalisation and unnecessary advertising integrations disabled.
- [ ] Configure `generate_lead`, `purchase`, `sign_up` as key events; keep the other events diagnostic.
- [ ] Start with useful event-scoped dimensions: `service_type`, `plan_interest`, `event_type`, `payment_type`, `signup_location`. Add `cta_location`, `form_location`, `room_category` or `occupancy` only when a specific diagnostic report needs them. Native campaign/ecommerce fields need no duplicate dimensions; do not register transaction IDs as custom dimensions.
- [ ] Review Stripe unwanted referrals and verify first-party attribution continuity after checkout.
- [ ] Verify Google processing terms, controller/account details, transfer safeguards, data-sharing settings and actual property retention/reset settings. Browser durations do not describe GA retention. Flag any required extra policy wording for exact editorial approval.

### Before release

- [x] A-06 exact text and regression tests included; unchanged cookie configuration.
- [x] B-01–B-07 implemented using the exact approved wording, including revised B-04 and B-06. No additional copy proposals are pending.
- [ ] Review the combined staged and unstaged diff so only intended changes enter the release.
- [ ] Set `ANALYTICS_POLICY_EFFECTIVE_DATE` to the actual approved publication date; do not invent/backdate it. Confirm A-03/A-04/A-05 with A-06 render alongside preserved policy content and the updated effective version/date.
- [ ] Obtain explicit production deployment approval. This work has not deployed or activated GA.

### After authorised deployment

- [ ] Fresh browser: no Google requests before consent or after rejection; single tag after acceptance with advertising signals denied.
- [ ] Check persistence, same-page changes, withdrawal, private-route transitions, and exact cookie names/lifetimes against A-06. Recheck the current real tag because Google can update its asset.
- [ ] Confirm one page view per real navigation; no sensitive parameters/payloads; no GA on localhost, previews, staging, admin, authentication or private accounts.
- [ ] Verify Instagram/newsletter campaign attribution in Tag Assistant/Realtime/DebugView and native acquisition reports after processing.
- [ ] With authorised test identities, confirm successful/failed enquiry and double-opt-in outcomes; guide event only after accepted email dispatch. No real customer data for tests.
- [ ] With an authorised Stripe test arrangement, check deposit/full initial purchases, deduplication and no purchases for failed/cancelled/later-balance payments. Do not make real purchases without separate authorisation.
- [ ] Check mobile booking controls, photo gallery, navigation, Vercel Analytics and Speed Insights. Compare mobile field performance after activation.

**Local implementation is ready for owner review; deployment is not authorised.** No event is claimed to be visible in the real GA property. B-07 is the only changed SEO title; other metadata wording is preserved. Production reporting, Search Console rich-result eligibility and field performance remain post-release checks.
