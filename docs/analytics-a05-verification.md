# A-05 implementation and factual verification

> **Stage A closure / Stage B update:** The owner approved A-06 exactly. Its replacement duration cell is now implemented, retaining the Google cookie configuration. Both desktop/mobile real-tag checks pass against that disclosure (fixed `_ga`, stream cookie up to 180 days from latest update); all collection was blocked. Historical blocker statements below describe the earlier A-05 review and are superseded. See [Stage B handover](stage-b-handover.md) for current release checks. No deployment or GA account verification has occurred.

Completed locally 19 October 2026. **No deployment or Stage B work. Publication remains blocked by the Google-cookie expiry finding below.**

## Implemented

- Exact owner-approved A-05 wording follows A-03 in `/cookies`, behind `ANALYTICS_POLICY_EFFECTIVE_DATE`. No publication date has been set or invented. Existing A-01–A-04 and other policy copy remain intact.
- Legal-page rendering now supports Markdown headings and semantic tables, with column headers and wrapping cells, so the approved table is displayed as a table rather than raw pipe-separated text.
- Deduplication markers record their creation time. They are valid for at most 180 days, with no lifetime refresh on duplicate checks. Expired, malformed, future-dated and legacy undated markers are removed. Withdrawal removes all `st-ga-sent:*` entries while preserving the rejected preference.
- Attribution and coaching-plan records expire after 30 minutes. Cleanup runs while the application is active and on subsequent access. Expired campaign defaults are also removed from the Google context without replaying a page view or disabling later conversions.
- Withdrawal clears attribution/plan storage and accessible GA cookies, destroys the tag, and requests deletion of the HttpOnly newsletter receipt through a same-origin DELETE endpoint. That endpoint never returns proof or sends analytics.
- Newsletter verification and guide delivery remain independent of analytics consent. The receipt is still issued only with affirmative analytics consent and verified subscription confirmation.

Browser localStorage/sessionStorage have no native background TTL. Expired records are never reused; physical deletion occurs while the page runs or on its next access. A closed browser cannot run cleanup. This distinction applies to browser-storage retention; it does not change Google account-level retention or erase data previously sent.

## Real Google tag verification

The actual `gtag.js` asset for `G-PT4XP6G7CF` was downloaded separately. Tests served that unchanged asset in an isolated browser using an intercepted production-origin page. **All collection requests were aborted before transmission.** No test conversion was sent to GA4, and no production page was deployed or modified.

The test exposed two facts that mocks could not establish:

1. Google loaded in the previous `about:srcdoc` context but did not create cookies or attempt collection. The isolated design now uses an inert same-origin HTTPS document at `/api/analytics/frame`. This route contains no Google code and is noindex/no-store; the parent injects the tag only after the existing consent, environment and public-route checks. The real tag then created the expected cookies. Isolation from parent forms and sensitive URLs is preserved.
2. Both cookies initially received approximately 180-day lifetimes, but their revisit behaviour differs:

| Cookie           | Observed revisit expiry change                                             | Withdrawal |
| ---------------- | -------------------------------------------------------------------------- | ---------- |
| `_ga`            | 0 seconds; original expiry retained                                        | Removed    |
| `_ga_PT4XP6G7CF` | +2 seconds after a revisit approximately 2 seconds later; expiry refreshed | Removed    |

The same behaviour occurred in desktop and mobile Chromium tests despite `cookie_update: false`. This is an observed compatibility issue, not a successful verification of the approved non-refreshing expiry claim. The two opt-in real-tag tests intentionally fail that assertion and attach cookie-name/lifetime/change evidence without cookie values or identities.

**Release blocker:** A-05 currently says both cookies expire from creation without automatically extending on visits. Do not activate analytics or publish A-05 until the implementation can enforce that statement or the owner approves accurate amended wording. A-06 in the Copy Change Register proposes an alternative duration cell; it is not implemented. We have not added a workaround that parses undocumented Google cookie formats or silently introduced extra tracking storage.

This verifies actual downloaded Google code in a controlled browser, not live production GA reporting or account settings. Real production checks are still required after an approved release.

## Final test results

- **86 unit tests passed across 13 files**, including exact policy insertion, table rendering, fixed deduplication expiry, withdrawal, receipt controls, newsletter independence and initial payment projections.
- **20 consent/storage browser tests passed** across desktop and mobile, including timed 30-minute expiry, no duplicate page view, and axe checks on the consent dialog.
- **2 opt-in real-Google-tag tests failed** the non-extending stream-cookie expiry assertion (one desktop, one mobile). Cookie creation, names, initial lifetimes and withdrawal removal were observed successfully. This failure blocks publication; it is not hidden by the passing mocked tests.
- Typecheck passed. Lint passed with three pre-existing navigation warnings and no errors.
- Webpack production build passed, including TypeScript and 215 generated pages. `git diff --check` passed.
- Real asset SHA-256: `76808a6a1678682ba05558ec73187dfc598ecad5b8e4f1524b7a3048beea924a`. It is not committed to the repository. Google can change this asset, so the real-tag check should be rerun before any eventual activation.

## Required verification outcomes

| Requirement                                                          | Status                                                                                                                                                                      |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accept/reject preference works without collection                    | Automated browser checks pass; reject retains the preference and no tag loads.                                                                                              |
| Receipt requires analytics consent; newsletter/guide work without it | Route/unit regression tests pass.                                                                                                                                           |
| 180-day deduplication maximum validity and cleanup                   | Unit/browser checks cover fixed creation time, expiry, legacy cleanup, and withdrawal. Transaction hash/deduplication behaviour remains intact during the retention window. |
| Optional storage removed on withdrawal                               | Client tests pass; HttpOnly deletion endpoint tested separately. A failed/offline deletion request leaves the receipt unusable and subject to its ten-minute expiry.        |
| Actual Google cookie names and expiry                                | Names/initial lifetimes/removal verified; non-extending expiry assertion **fails** for the stream cookie.                                                                   |
| Attribution/plan durations                                           | Expired stored values are removed; timed browser test checks expiry and absence of duplicate page views.                                                                    |
| Browser durations distinct from GA retention                         | Exact approved wording states the distinction. Actual GA account retention remains an owner/account check.                                                                  |

## Files changed in this A-05 pass

- `src/lib/analytics/policy.ts`, `client.ts`; new `storage.ts`.
- `src/components/analytics/provider.tsx`.
- `src/app/api/analytics/receipt/route.ts`; new `frame/route.ts`.
- `src/lib/content/structured-text.ts`, `src/views/legal-document.tsx`.
- Analytics unit tests: contracts, receipt route, new storage and legal-table tests.
- Browser tests: consent regression coverage and new opt-in `real-tag.spec.ts`.
- Copy Change Register and Stage A handover/refinement documentation.

## Reproducing the checks

```sh
pnpm exec vitest run tests/unit/analytics tests/unit/public/newsletter tests/unit/public/blog/structured-text.test.ts tests/unit/retreats/checkout-success.test.ts tests/unit/public/coaching/enquiries-route.test.ts tests/unit/public/retreat-checkout-route.test.ts
pnpm exec playwright test --config playwright.analytics.config.ts consent.spec.ts --workers=2
# Separately download the real gtag asset, then run with all collection intercepted:
REAL_GTAG_FILE=/tmp/shruti-real-gtag.js pnpm exec playwright test --config playwright.analytics.config.ts real-tag.spec.ts --workers=2
pnpm run typecheck
pnpm run lint
pnpm exec next build --webpack
```

The real-tag test is opt-in because it needs a downloaded Google asset. Its current failing expiry assertion is a release check, not a reason to weaken the test. Existing staged coaching/retreat work is preserved; no commits or pushes were made.
