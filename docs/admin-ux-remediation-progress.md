# Admin UX remediation: implementation progress

Updated 11 September 2026. Scope: [the remediation plan](admin-ux-remediation-plan.md).

**In progress, not ready to declare the whole plan complete.** This is a working-tree implementation;
no staging/production migration, CMS import/repair, deployment, real email or real refund was performed
in this continuation. Preserve existing staged, unstaged and untracked work.

## Implemented foundations

- Import: separate draft/published reads and hashes; source identity/provenance checks; unchanged
  reimports make no writes; source changes and slug/provenance conflicts fail closed.
- Newsletter: frozen recipient manifests, resumable preparation, campaign leases, per-attempt claims,
  unsubscribe suppression, ambiguous-outcome preservation and selected-recipient reconciliation with
  evidence and expected attempt counts. Reconciliation uses a contextual dialog, not browser confirms.
- Creation: one atomic, idempotent draft endpoint; durable request recovery; stable experience identity;
  draft slug propagation; publication/revision conflict checks; format defaults; explicit IANA timezone
  conversion rejecting missing/repeated daylight-saving wall times. App-owned online creation does not
  need Contentful.
- Shared admin shell: accessible mobile Sheet, skip link, current-page navigation, distinct website and
  sign-out actions; quieter admin-only card styling.
- Retreat operations: grouped guests/registration/payment views, capability-aware sections, selected-date
  public link, secondary cancellation dialog with checked impact version. Invalid sections/setup steps
  fall back safely. Early-bird deadlines are collapsed and shown only when an early-bird rate exists.
- Event/venue editing: saved versus unsaved venue counts; venue-associated save/discard bar; shared
  image fields with alt validation and public focal-position helper; event-editor save/discard guard.
  Server-authorised Event Page editor reads match its staff-admin API policy.
- People: compact coaching records with canonical detail links and legacy query-link resolution;
  next-step summary before enquiry history; member messaging in a dialog; access/privacy moved below
  routine member work.
- Newsletter/business: separate workspaces; business sections load independently and survive unrelated
  failures; allowlisted URL state for business/newsletter sections and retreat lifecycle.
- Dashboard/audit/moderation: unavailable states are not healthy zeros; labelled filters; explicit audit
  errors; permanent comment/reply deletion confirmation; stale comment-search results cannot win a race.

## Outstanding gates and implementation work

The follow-up image library, format creation and simplified customer checkout work is recorded in
[the weekend checklist](weekend-checkout-admin-checklist.md). It includes the January-instance fix,
single-choice suppression, compact layout and consent-evidence correction. Production is unchanged;
the developer will test and deploy the combined changes. This does not close the remaining gates below.

1. **Import fixtures and historical review (A):** complete V1-published/V2-draft transformation fixtures,
   locale/fallback handling and conversion-loss/gallery reporting. Add a reviewed update mechanism with
   source-hash and app-revision checks. Audit old imports read-only before requesting any repair.
2. **Newsletter recovery coverage (B):** real-DB concurrency/crash/reconciliation integration tests and
   provider-mocked recovery browser journeys. Audit legacy incomplete campaigns. Define and verify a
   worker-drain/rollback procedure; old workers do not honour new leases.
3. **Creation/readiness (C/E):** structured readiness issues with actual field links/focus, stronger
   aggregate creation audit coverage, all-four-format/DST browser cases, public identity grouping review.
4. **Forms and operational refinement (D/E/F):** extend unsaved handling beyond venue/editor to wizard
   and other major forms (including back/button navigation); explicit export scope; venue removal/change
   impact and booked-stock protections; shared image controls are not a full draft preview.
5. **Private public-layout preview (F):** implement the authorised, private, non-indexed preview route
   using actual draft data and selected date with shared public presentation. Verify supplied photo crops
   visually at mobile/desktop and 200% zoom, not solely by helper assertions.
6. **Members/coaching (G):** simplify remaining filters; preserve pipeline return/filter context; improve
   detail primary actions; replace remaining consequential browser confirms; verify role/privacy cases.
7. **Billing/refunds (H):** authorised payment selection, exact pounds parsing, server preview and safe
   duplicate submission. Source review found membership refund service still performs external Stripe
   creation without an idempotency key and reads refund capacity before reservation. Fix those service
   invariants with concurrency/provider tests before presenting the new UI as duplicate-safe. Do not
   introduce a separate refund engine or issue real refunds during tests.
8. **Remaining admin polish (H/I):** newsletter load/error isolation and remembered filters; business
   mutation refreshes and pricing-impact copy; audit pagination/labels/export scope; moderation retained
   filters; broader keyboard/axe checks and operational failure fixtures.

## Verification recorded in this continuation

- `pnpm exec vitest run tests/unit/retreats tests/unit/shared/newsletter-campaign-automation.test.ts
  tests/unit/admin/business-service.test.ts tests/unit/admin/blog/comments-route.test.ts
  tests/integration/admin/retreat-creation.integration.test.ts
  tests/integration/admin/blog/comments.integration.test.ts`: **24 files / 148 tests passed**.
- Local Chromium, against `http://127.0.0.1:3000`,
  `tests/e2e/app/admin-ux-remediation.spec.ts` and
  `tests/e2e/app/retreats/registration-operations.spec.ts`: **4 tests passed**. Includes business overview
  failure with working Settings, remembered section after reload, 320/390/768/1440 reflow, editor
  validation/discard, grouped private guest registration, cancellation impact preview, and atomic draft
  creation/repeat workflow. Axe checks cover the tested surfaces; this is not an audit of every admin page.
- Cancellation unit tests cover remaining captured funds, two guests per booking and stale preview
  rejection before any cancellation/refund/email.
- Final typecheck passed; lint passed with three pre-existing Next navigation warnings in
  `booking-modal.tsx` and `auth-context.tsx`. `git diff --check` passed.
- Chromium and the first production build attempt hit sandbox process/port restrictions. Browser tests
  passed with approved escalation. `pnpm build` still hit the same Turbopack CSS-worker port error after
  approved escalation. The supported diagnostic fallback `pnpm exec next build --webpack` **passed**,
  including TypeScript and generation of all 197 static pages. No bundler configuration was changed;
  the default Turbopack build remains an environment-specific verification gap before release.

Local migrations from the preceding implementation work were applied only after confirming the local
database target (`127.0.0.1:5433/strength_yoga`). Remote changes remain a separate, explicitly targeted
operation. New test creation-request rows are cleaned up by their fixture actor ID.
