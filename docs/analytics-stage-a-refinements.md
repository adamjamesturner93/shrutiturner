# Stage A final refinements — production approval handover

> **Stage A closure / Stage B update:** The owner approved A-06 exactly. Its replacement duration cell is now implemented, retaining the Google cookie configuration. Both desktop/mobile real-tag checks pass against that disclosure (fixed `_ga`, stream cookie up to 180 days from latest update); all collection was blocked. Historical blocker statements below describe the earlier A-05 review and are superseded. See [Stage B handover](stage-b-handover.md) for current release checks. No deployment or GA account verification has occurred.

Status: implemented locally; **A-05 publication blocked by observed Google-cookie expiry refresh**. See [latest A-05 verification](analytics-a05-verification.md). No deployment, account configuration changes or Stage B work. Existing staged design changes remain intact. This document supplements and updates the [Stage A handover](analytics-stage-a-handover.md).

## What changed

1. Added a closed vocabulary for UTM source, medium and campaign, plus a fixed external referring-domain allowlist. Validated values populate native GA acquisition fields in the existing isolated tag.
2. Renamed the diagnostic event to `guide_delivery_initiated` throughout runtime contracts, receipt consumption and current event documentation. It means Postmark accepted guide-email dispatch after verified newsletter double opt-in, not an open or download.
3. Added tests demonstrating that no-consent/rejected analytics never create an analytics receipt while verification and guide delivery still work; unsuccessful/skipped delivery cannot set the guide flag; expired proof is rejected.
4. Recorded final approval of A-01 through A-04. Their wording is unchanged. A-05 is now approved with amendments and implemented behind the publication gate; the latest verification records a factual blocker.

## Privacy-safe acquisition

Capture happens only after production-host, eligible-route and affirmative-consent checks. No landing URL, campaign record or referrer is cached before consent. If someone leaves the campaign landing page before accepting, its original campaign is intentionally unavailable.

Only these exact values (case-normalised) are accepted:

| Field          | Allowed values                                                                                             |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `utm_source`   | `instagram`, `newsletter`, `facebook`, `linkedin`, `google`, `bing`                                        |
| `utm_medium`   | `social`, `organic_social`, `email`, `organic`, `referral`                                                 |
| `utm_campaign` | `coaching`, `newsletter`, `pause-and-restore`, `pause-and-restore-2026`, `powis-house`, `powis-house-2027` |

Source and medium must both be valid. Campaign name is optional; when supplied it must be valid. Duplicate keys, oversized inputs and unrecognised values discard the campaign. Other parameters, including advertising click IDs, free text, `utm_term`, `utm_content`, email and payment references, are never copied. Arbitrary slug-shaped text is deliberately not accepted. Future campaign labels need an explicit non-sensitive allowlist entry in `attribution.ts`, not a looser text filter.

Allowed external referrers are exact reviewed host variants of Instagram, Facebook, LinkedIn, Google (.com/.co.uk) and Bing. They become fixed HTTPS origins only: no path, query, fragment, username, password or arbitrary subdomain. Unknown domains, internal URLs, payment domains and credential-bearing URLs are dropped. The source file contains the complete host mapping.

After consent, `st-analytics-attribution-v1` in sessionStorage keeps only revalidated values, expiring after 30 minutes without an eligible page-navigation refresh, or when that tab session ends. Withdrawal clears it. Normal internal navigation and reloads preserve the record; a new valid campaign replaces it. Campaign data takes precedence over domain-only referral. Storage failure does not break forms or checkout.

The native fields `campaign_source`, `campaign_medium` and `campaign_name` are set on Google configuration before events; safe `page_referrer` is provided for domain referrals. These are **not custom dimensions**. All `page_location` values remain canonical and query-free. No larger architecture change was needed. This follows [Google's documented configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config).

Representative links for controlled production verification after release:

```text
https://shrutiturner.co.uk/retreats/powis-house?utm_source=instagram&utm_medium=social&utm_campaign=powis-house-2027
https://shrutiturner.co.uk/retreats/pause-and-restore?utm_source=newsletter&utm_medium=email&utm_campaign=pause-and-restore-2026
https://shrutiturner.co.uk/coaching?utm_source=instagram&utm_medium=social&utm_campaign=coaching
```

Use the actual published event URL when creating a campaign; the Powis House path above is an illustrative path, not a new route or a claim about its current production slug.

**Reporting verification still required:** in fresh consenting test visits, check native Session source/medium and Session campaign in Traffic acquisition, and First user source/medium in User acquisition. Then verify the same source accompanies the relevant key events. Mocked gtag configuration tests cannot prove Google's processing, channel classification or reporting attribution. Cross-device visits, new email tabs, blocked cookies and elapsed sessions can lose continuity. Session attribution and first-user attribution have different meanings; no custom visitor profile is created.

## Newsletter receipt behaviour — confirmed from code and tests

- Newsletter verification and guide sending happen first and do not depend on analytics consent.
- Only a verification request with the explicit first-party `st_analytics=granted` preference can receive `st_analytics_receipt`. Newsletter marketing consent is never substituted.
- The signed receipt contains a random deduplication identifier, a fixed signup-location category, a guide-dispatch boolean and expiry; it contains no subscriber identity, email or verification token.
- Cookie attributes: HttpOnly, Secure, SameSite=Lax, Path=/, Max-Age=600 seconds. It is cleared when consumed. If consent is withdrawn before consumption it cannot be used for collection; withdrawal now also requests first-party deletion of that HttpOnly cookie; if the request is blocked, it expires automatically within ten minutes.
- Consumption requires the same-origin POST and current analytics consent; client transmission additionally requires all GA environment/route/consent gates.
- A success query string by itself is not evidence. An initial subscribe submission is not `sign_up`. Browser deduplication suppresses repeated receipt events, while the underlying one-use verification token prevents repeating the business action.
- No consent at verification means no receipt and no later retrospective subscription event. A different browser/device, missing cookies, an expired receipt or failure to return can lose measurement while the real subscription and guide delivery remain successful.
- `guide_delivery_initiated` fires only for the signed positive dispatch result. Postmark failure, skipped dispatch or no confirmed result emits none. Delivery acceptance is not proof of inbox arrival, reading or downloading.

## Event inventory / GA key events

The complete trigger/parameter/component inventory remains in [the handover](analytics-stage-a-handover.md#event-inventory), with these final names:

| Event                      | Classification                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `generate_lead`            | Primary key event; validated successful coaching enquiry                             |
| `purchase`                 | Primary key event; verified initial paid Stripe session, actual collected GBP amount |
| `sign_up`                  | Primary key event; verified newsletter double opt-in                                 |
| `page_view`                | Diagnostic                                                                           |
| `coaching_cta_click`       | Diagnostic                                                                           |
| `room_selected`            | Diagnostic                                                                           |
| `begin_checkout`           | Diagnostic                                                                           |
| `guide_delivery_initiated` | Diagnostic; accepted guide-email dispatch only                                       |

No old guide event should be configured as a key event. Deposits/full payments, hashed transaction IDs, deduplication and exclusion of subsequent balances are unchanged.

## Policy verification: verified facts versus outstanding account facts

The current published [cookie policy](https://shrutiturner.co.uk/cookies) and [privacy policy](https://shrutiturner.co.uk/privacy) were reviewed read-only. Existing content remains intact. A-03/A-04 are fully editorially approved and implemented behind `ANALYTICS_POLICY_EFFECTIVE_DATE`; they must publish together with activation, using the actual approved release date. No date has been invented or configured.

| Check                                                                             | Result / remaining evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No Google before consent, public-only measurement, permitted payloads, withdrawal | Implemented and automated/mock tested. Real Google network behaviour must also be checked after deployment.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Approved policy statements                                                        | Match the implementation's purposes, payload exclusions and future-collection controls. Withdrawal does not promise retrospective deletion. No existing contradictory numerical retention claim was found.                                                                                                                                                                                                                                                                                                                                             |
| Google processing terms                                                           | Reviewed [Google's terms guidance](https://support.google.com/analytics/answer/3379636) and [Ads Data Processing Terms](https://business.safety.google/adsprocessorterms/). These describe the available contractual framework, not proof that this account has accepted it. Owner must verify acceptance, legal entity and data protection contact.                                                                                                                                                                                                   |
| International transfers                                                           | Existing privacy section 6 mentions overseas processing and recognised safeguards. Google's terms include transfer provisions; the arrangement applicable to this account has not been independently established. Owner must confirm the applicable UK safeguards and contract before release.                                                                                                                                                                                                                                                         |
| Data sharing                                                                      | Google product/service sharing can change applicable processing roles. Review and disable unnecessary sharing; do not infer the account setting from tag flags. See [Google's explanation](https://support.google.com/analytics/answer/9024351).                                                                                                                                                                                                                                                                                                       |
| Retention                                                                         | Account setting unavailable. Existing policy uses general retention wording, not a specific GA duration. Record the actual duration and reset-on-new-activity setting; do not confuse browser cookie lifetime with server retention. See [Google retention controls](https://support.google.com/analytics/answer/7667196).                                                                                                                                                                                                                             |
| Signals / ads                                                                     | Code disables Signals and personalisation and denies all advertising consent signals. Owner must independently verify property-level Signals, ads links, user-provided-data collection and sharing settings.                                                                                                                                                                                                                                                                                                                                           |
| Cookie duration disclosure                                                        | Existing published policy omits specific durations. [ICO guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-we-comply-with-the-pecr-rules/) calls for clear information including duration. A table is a practical presentation, rather than a mandated format. A-05 is approved with amendments and implemented, but observed Google-cookie expiry conflicts with its approved wording. No unapproved policy prose was inserted. |

No authenticated GA Admin access or signed-contract evidence was available in this session. The read-only GA browser inspection attempt could not launch because that browser connector requires a Chrome installation absent from this environment; automated tests used the separately installed Playwright Chromium successfully. Those checks are explicitly outstanding, not completed. This technical review is not legal sign-off.

### Storage inventory

| Name                                                  | Purpose                                                       | Creation / duration                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `st_analytics` cookie; `st-analytics-v1` localStorage | Remember analytics choice; server can honour it               | On explicit accept/reject/save; 180 days (expired localStorage value is ignored)                                                                   |
| `_ga`, `_ga_PT4XP6G7CF`                               | Google's browser/session measurement identifiers              | Only after consent; configured 180 days with expiry refresh disabled; actual real-tag names/expiry need production inspection                      |
| `st_analytics_receipt`                                | Carry verified newsletter/guide outcome to consenting browser | After verification with analytics consent; up to 10 minutes, cleared on consumption                                                                |
| `st-analytics-attribution-v1` sessionStorage          | Carry fixed campaign/referral categories between pages        | Consent-only; 30-minute stored validity refreshed on eligible navigation, within tab session; cleared on withdrawal                                |
| `st-analytics-plan` sessionStorage                    | Carry selected plan category to enquiry                       | Consent-only; valid for 30 minutes within tab session; cleared on withdrawal                                                                       |
| `st-ga-sent:*` localStorage                           | Prevent repeat conversion counting                            | Consent-only; valid for 180 days from recorded event; cleanup removes expired/invalid records and withdrawal removes all markers; no guest details |

This inventory covers Stage A. Existing Auth.js, Stripe, Turnstile, Vercel and other service technologies are preserved; it is not a claim to be a full live-site third-party cookie audit.

## Files changed in these refinements

- New: `src/lib/analytics/attribution.ts`, `tests/unit/analytics/attribution.test.ts`, this document.
- Updated: `src/lib/analytics/client.ts`, `src/lib/analytics/contracts.ts`, `src/components/analytics/provider.tsx`.
- Tests: `tests/e2e/analytics/consent.spec.ts`, `tests/unit/analytics/contracts.test.ts`, `tests/unit/public/newsletter/verify-route.test.ts`.
- Documentation: `docs/analytics-stage-a-handover.md`, `docs/analytics-stage-a-audit.md`, `docs/copy-change-register.md`.

The handover retains the complete Stage A file inventory. No booking, authentication or newsletter business rules changed in this refinement pass.

## Final validation results

| Check                            | Result                                                                                                                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted unit tests              | **155 passed across 20 files**. Includes attribution allowlists, expiry, receipts, no-consent newsletter delivery, guide failures, enquiry outcomes, initial purchases/balances, room/inventory/pricing and authentication logic.                                |
| Browser tests                    | **14 passed** across 1440px desktop and 390px mobile. Real local consent UI plus intercepted production-origin runtime with mocked Google; Instagram/email native fields, referring-domain stripping, persistence, withdrawal and duplicate suppression checked. |
| Accessibility                    | Axe consent-dialog checks passed in both browser projects.                                                                                                                                                                                                       |
| Type checking                    | Passed.                                                                                                                                                                                                                                                          |
| Lint                             | Passed, no errors; three unchanged navigation warnings in booking-modal/auth-context.                                                                                                                                                                            |
| Production build                 | `pnpm exec next build --webpack` passed, including TypeScript and 214 static pages. Webpack retained because the earlier Turbopack attempt hit an environment worker-port restriction.                                                                           |
| Diff whitespace                  | `git diff --check` passed.                                                                                                                                                                                                                                       |
| Live GA reporting / real payment | Not performed. Requires approved deployment and authorised production verification; no real purchases, customer data or emails used.                                                                                                                             |

The expanded unit run includes `tests/unit/analytics`, `tests/unit/public/newsletter`, coaching enquiries and retreat checkout routes, `tests/unit/auth`, `tests/unit/public/auth`, and retreat checkout-success, pricing, room-choice, physical-inventory, workshop-payment and deposit-display tests. Browser command: `pnpm exec playwright test --config playwright.analytics.config.ts`.

## Remaining tasks and release checklist

### Manual GA account tasks — owner

- [ ] Confirm stream ID `G-PT4XP6G7CF`; no duplicate tag/GTM installation.
- [ ] Verify terms acceptance, controller details, relevant UK transfer safeguards and sharing settings.
- [ ] Record actual data retention and reset settings; confirm disclosures are adequate.
- [ ] Verify Signals, personalised advertising, user-provided-data collection and unnecessary advertising integrations are off.
- [ ] Disable automatic enhanced-measurement collection as specified in the main handover; use explicit app page views/conversions.
- [ ] Configure only `generate_lead`, `purchase`, `sign_up` as key events, and the documented custom dimensions. Native campaign fields need no custom dimensions.
- [ ] Review Stripe unwanted referrals; no linker IDs or advertising trackers are added.

### Decisions before activation

- [ ] Resolve the real Google-cookie expiry mismatch before publishing approved A-05; A-06 is an unapproved alternative.
- [ ] Supply the actual approved publication date only when release is authorised; GA and approved policy additions share that release gate.
- [ ] Review the full analytics diff independently of pre-existing staged design work.
- [ ] Explicitly approve production deployment. Nothing in this handover deploys automatically.

### After approved deployment

- [ ] Inspect real network traffic for no-consent/reject/accept/withdraw states and public-to-private navigation.
- [ ] Inspect cookie names, expiry, first-party continuity and preference changes with the real Google tag.
- [ ] Validate Instagram/newsletter examples in Tag Assistant/DebugView, then native acquisition reports after processing. Inspect all payloads for sensitive data.
- [ ] Check single page views, successful/failed enquiries, confirmed newsletter/guide outcomes and repeat visits.
- [ ] Use an authorised payment test arrangement to check initial deposit/full payment amounts and deduplication; ensure cancelled/failed/balance payments emit no new-booking purchase.
- [ ] Verify Vercel Analytics, Speed Insights and existing booking/authentication journeys remain functional.

No claim is made that events are visible in the GA property. Mock tests demonstrate application inputs and privacy controls, not Google's end-to-end reporting. Stage B remains paused pending separate approval.
