# Admin UX, reliability and simplification remediation plan

Date: 10 September 2026. Intended executor: GPT-5.6 Sol.

Status: proposal only. No application, database or Contentful changes are authorised by this document alone.

## 1. Scope and evidence

This combines the implementation review's eight functional findings with a source-based UX/UI review of the admin shell, dashboard, retreats/workshops, venue rooms, event editing, members, coaching, newsletter, business, audit and comment moderation. Public `/retreats` and checkout are included where they share event data or complete an admin workflow.

Evidence is the current working tree, the user's screenshots and the operating-model documents. The original detailed implementation plan is not present in the available record; this is a concrete remediation baseline, not a claim of exhaustive line-by-line compliance with that missing document. The browser connector could not launch Chrome, so current visual appearance, contrast, responsive behaviour and assistive-technology behaviour still need fresh browser verification. Source findings below are distinguished from proposed design decisions. Existing test results do not establish coverage of these newly identified failure cases.

Classes/programmes receive shared-shell regression checks; their scheduling and booking models have not received an equivalent detailed audit here. Do not redesign them as an incidental part of this work.

## 2. Review outcome

The implementation has useful foundations: app-owned inventory, grouped bookings, per-person registration, bed preferences, operational sections and a single Markdown schedule field. Keep those. The remaining problem is that the interface frequently presents the underlying systems instead of the administrator's next task. Adding tabs or jump links has not always moved low-frequency setup out of the daily workflow.

### Functional findings carried forward

| ID | Priority | Confirmed code finding | Required result |
| --- | --- | --- | --- |
| R1 | P0 | The Contentful importer reads current management-API fields and treats the existence of `publishedVersion` as permission to put those fields into `publishedContentJson`. Newer unpublished edits can become public. | Independently import the actual published snapshot and current draft, including linked content. |
| R2 | P0 | The importer matches by source ID OR slug, then updates without checking app edits or concurrent revision changes. | No silent slug takeover or replacement of app-authored changes. |
| R3 | P0 | Newsletter retry sets campaign status to `sending` before awaiting delivery without a recovery catch; retry refuses sending deliveries while reconciliation requires a different campaign status. | Every interrupted attempt has a safe, reachable recovery path without duplicate sends. |
| R4 | P0 | Newsletter audience materialisation can stop before `audiencePreparedAt`; republish skips the existing campaign and retry requires that marker. | Resume the same frozen audience without creating another campaign or changing recipients. |
| R5 | P1 | Saving a draft Event Page slug does not update linked dates, while several public/readiness paths still join by slug. | App-owned dates use `experienceId`; legacy slug snapshots stay consistent. |
| R6 | P1 | Creation performs page creation, publication and date creation as separate client requests; a failure loses the created ID and retry can duplicate/conflict. | Idempotent, recoverable draft creation with a clear saved outcome. |
| R7 | P1 | Saved format defaults, including duration and some operational settings, are ignored or replaced by hardcoded values. | One server-side default resolver with explicit overrides and a date snapshot. |
| R8 | P1 | App-owned event readiness unconditionally fetches legacy Contentful templates. | CMS failure cannot block operations that have all required app-owned data. |

P0 means address before further affected imports/sends or a rollout relying on their safety. This plan does not itself disable live services or change any remote data.

### Additional UX/UI findings

| Area | Source evidence | Impact and proposed direction |
| --- | --- | --- |
| Shell | `src/components/admin-layout.tsx`: “Back to Site” invokes logout; mobile navigation is a custom overlay with an unnamed close button and no explicit dialog/focus handling. | Separate View website and Sign out. Use the existing Sheet primitive, proper focus handling and a skip link. |
| Dashboard | `src/views/admin/dashboard.tsx`: static “Enabled”/“Live” metrics; absent email-health data becomes “Clear”; absent coaching data can imply nothing due. | Show actionable workload. Distinguish loading/unavailable from a verified zero. |
| Event list | `src/views/admin/retreats.tsx`: four competing header actions; local-only filters; aggregate metrics are not clearly scoped to the filtered list. | Dates first, one Create event action, secondary setup links, persistent filters and labelled counts. |
| Event detail | `src/views/admin/retreat-detail.tsx`: prominent cancellation; setup numbering starts at 3; readiness messages all target one generic anchor; public link omits the selected date. | Operational default for live events, an understandable draft checklist, contextual error links and date-specific preview. |
| Guest workspace | `src/components/admin/retreat-operations.tsx`: large expanded booking cards; local filters; export scope is not obvious; non-residential display can show online-access language for offline events. | Compact grouped bookings with both people/statuses visible, explicit export scope and event-capability-aware copy. |
| Venue rooms | `src/views/admin/retreat-venues.tsx`: configured venues collapse without a clear chevron; summaries derive from edited drafts alongside saved-state badges; save sits at the bottom. | Explicit edit affordance, saved versus unsaved distinction, scoped save bar and inventory-impact explanation. |
| Creation/editing | `retreat-create.tsx`, `retreat-experience-editor.tsx`: technical image URL entry; incomplete image fields can omit the image; no robust interrupted-save journey. | Explicit image validation, draft preservation, preview and clear content/date ownership. |
| Members | `members.tsx`: placeholder-only search and many always-visible filters. `member-detail.tsx`: access/role and privacy controls remain early in the long page despite jump links. | Search-first people management; membership/activity/notes first; access and privacy in a separate section. |
| Coaching | `coaching.tsx`: many operational records auto-expand; badge-heavy summaries; enquiry answers precede the next operational step. | A compact pipeline with one selected record and an actionable checklist. |
| Newsletter | `newsletter.tsx`: campaign management and audience management share one long page. `campaign-detail.tsx`: reconciliation applies one outcome to all ambiguous deliveries. | Separate Campaigns/Audience; recipient-level, evidence-backed reconciliation. |
| Business | `business.tsx`: tab rendering depends on a successful overview; fetch failures can look like absent metrics; refund form asks for Membership ID and pence. | Independently loadable sections, explicit failures, member/payment selection and amounts in pounds. |
| Audit/comments | `audit.tsx`: free-text technical filters without labels, failed reads can look empty. `blog-comments.tsx`: placeholder-only search and immediate delete request. | Labelled filters, useful failures, contextual actions and clear confirmation of deletion consequences. |

## 3. Target information architecture

Keep existing URLs unless a new detail route materially improves the journey. Use “Retreats & workshops” in navigation and “event” for generic shared controls; retain retreat/workshop terminology in customer-facing copy.

| Workspace | Default work surface | Secondary/configuration surface |
| --- | --- | --- |
| Dashboard | Needs attention and upcoming work, with source status | Links into each workspace |
| Retreats & workshops | Upcoming/live dates; draft and past filters | Event pages, event defaults, venue rooms |
| Live event | Overview with next actions; Attendees & bookings one click away | Rooms OR Live session where applicable; Payments; Setup |
| Draft event | Setup checklist with first unresolved task | Guest preview; saved page/defaults references |
| Members | Searchable list and member operational summary | Access & privacy, with existing permissions |
| Coaching | Stage-filtered pipeline and next action | Selected client's details and historical enquiry |
| Newsletter | Campaigns with needs-attention filter | Audience; Contentful editorial link |
| Business | Clearly scoped financial overview | Pricing, discounts, class rules, site settings, billing operations |

Default event selection: drafts open Setup; open/closed live events open Overview; completed/cancelled events open a read-oriented Overview. Respect an explicit valid `section` query parameter. Day retreats and in-person workshops have neither a Rooms section nor online Live session controls.

## 4. Architectural decisions and constraints

1. **Ownership:** preserve `docs/contentful-model-ownership.md`. The app owns Event Pages, atmosphere, Markdown schedule, dates, formats, inventory, prices and bookings. Contentful owns venue editorial content and the existing blog/newsletter/editorial models. Do not move atmosphere back to Contentful or reintroduce nested schedule-day objects.
2. **Identity:** `RetreatDate.experienceId` is authoritative for migrated/app-created events. Slug fallback is only for legacy rows with no experience ID. Published slugs stay immutable. Keep legacy compatibility until verified migration and an explicit retirement decision.
3. **Snapshots:** publishing changes the public content snapshot; ordinary draft saves do not. Format changes affect newly created dates only. Venue inventory changes must not silently replace inventory/prices or invalidate allocations on existing dates.
4. **Server boundaries:** business rules remain in existing `src/lib` domains. UI capabilities come from server DTOs and shared event-capability helpers, not duplicated status checks. Client components never access Prisma or third-party credentials.
5. **Concurrency:** revision/CAS guards for editing and reconciliation, idempotency for creation/sending/refunds, and server-authorised targets for every mutation. Network responses may be lost after a successful write.
6. **External effects:** never hold a database transaction open across Contentful, Stripe or Postmark calls. Read pages do not send, reconcile, sync, refund, publish or mutate billing. Explicit actions describe the effect and refresh authoritative state.
7. **Schema:** only introduce additive fields/models required for provenance, recovery or idempotency. Do not edit applied migrations. Remote migrations run manually through the repo's environment-specific scripts, never `db push` or automatic deploy hooks.
8. **Privacy:** guest registration and health data remain person-specific. Booking relationships do not authorise a purchaser to read another adult's private answers. Do not put health data, contact searches or form drafts into URLs, analytics or browser storage.
9. **Scope:** use the current design system and service boundaries. No new admin framework, general workflow engine, mass CMS deletion, provider replacement or broad dashboard rewrite.

## 5. Work packages

### A. Repair Contentful import safety — R1, R2

**Existing files:** `scripts/import-retreat-experiences-from-contentful.ts`, `src/lib/retreats/experience-schema.ts`, `src/lib/retreats/experience-service.ts`, `prisma/schema.prisma`, `docs/contentful-model-ownership.md`.

**New files:** `scripts/lib/retreat-experience-import.ts` for pure transformation/planning; `tests/unit/retreats/experience-import.test.ts`; additive migration if provenance fields are required.

- Separate source reads for published content and draft content. A publication marker is not a published payload. Resolve linked schedule entries and assets against the appropriate source state and locale. If the published snapshot cannot be obtained reliably, report a conflict and do not publish the draft as a substitute.
- Store source space/environment/locale provenance alongside entry identity. Preserve existing provenance fields and backfill only from verified source information. Unknown provenance on previously imported rows requires review, not a guessed overwrite.
- Match source identity first. An unrelated matching slug is a collision, not an update target. Report collisions in dry-run output.
- Default reimports must not update an existing app record with changed source content automatically. Report `source_changed_requires_review`; the app is now the owner. An explicitly approved update must compare both the reviewed app revision and the reviewed source hashes at apply time. Never clear an app publication merely because the source is now unpublished.
- Use deterministic separate draft/published hashes, preserve imported image/focal data, and report conversion losses rather than silently omitting unsupported content. Keep schedule Markdown stable between runs.
- Apply an approved entry update and safe legacy date links in one database transaction. Reject revision conflicts; keep the old record intact. Dry-run performs no writes.

**Acceptance/verification:** fixtures for published V1 + unpublished V2, unpublished-only entries, locales/fallbacks, linked draft edits, missing assets, archived source, same slug/different identity, app edits, concurrent save, interrupted import and no-op rerun. Verify public reads contain V1 while the editor contains V2. Review previously imported records for possible draft leakage using read-only comparisons; any repair requires an explicit reviewed action. Do not assert existing imports are safe merely because rerunning was a no-op.

### B. Make newsletter preparation, retries and reconciliation recoverable — R3, R4

**Existing files:** `src/lib/newsletter/campaign-automation.ts`, `src/lib/postmark/client.ts`, `src/lib/admin/newsletter-service.ts`, `src/lib/api/types.ts`, `src/app/api/admin/newsletter/campaigns/[id]/retry/route.ts`, `src/app/api/admin/newsletter/campaigns/[id]/reconcile/route.ts`, `src/views/admin/campaign-detail.tsx`, `prisma/schema.prisma`.

**Tests:** extend `tests/unit/shared/newsletter-campaign-automation.test.ts` and `tests/integration/public/newsletter/campaign-reporting.integration.test.ts`; add `tests/e2e/app/newsletter/campaign-recovery.spec.ts`.

- Define an explicit internal state-transition table covering preparation, queued, active sending, definite failure, ambiguous outcome and completion. Map it to current persisted statuses where possible; add states only where necessary. Derive admin actions from the same server logic.
- Freeze campaign content and recipient membership durably before external sends. For the current workload, materialise the recipient delivery rows and completion marker atomically in a DB-only transaction. Do not send any batch until preparation is committed. If volume makes chunking necessary, first persist an immutable recipient manifest, then resume chunks against it with a unique campaign/recipient key.
- Add durable attempt ownership/lease metadata where missing. Claim eligible deliveries atomically before sending. Prevent concurrent retry, scheduled processing and reconciliation from claiming an active attempt.
- Catch provider failures in initial send and retry. A definite rejection can be retryable; an uncertain timeout must remain ambiguous. Expired attempts become reviewable, never automatically “not sent”. A catch alone does not solve process crashes: expose stale-attempt recovery using persisted attempt metadata.
- Reconciliation accepts selected delivery IDs, outcome, evidence/note and an expected revision/attempt identity. Validate that all selected rows belong to the campaign and are ambiguous, not actively sending. Mixed batch outcomes are resolved separately; accepted/sent and delivered must not be conflated.
- Confirming “not sent” permits a later explicit retry; it does not send immediately. Re-check current subscription eligibility before every send. Never rebuild an audience to recover a campaign, resend accepted deliveries or silently add new subscribers.
- Show per-recipient status, last attempt, safe next action and provider evidence. Keep technical diagnostics in a disclosure. Audit reconciliation and retry outcomes without logging message bodies or secrets.

**Acceptance/verification:** process failure during preparation, timeout after provider acceptance, crash before/after provider request, mixed outcomes, double retry, retry concurrent with reconciliation, subscriber unsubscribes after initial failure, repeat webhook and stale UI revision. Assert no duplicate campaign/recipient rows and no duplicate accepted send in deterministic tests. UI must offer a safe recovery route for every persisted failure state and explain when evidence is required. External mail stays mocked in automated tests.

### C. Make event creation and identity reliable — R5–R8

**Existing files:** `src/lib/retreats/experience-service.ts`, `src/lib/retreats/format-service.ts`, `src/lib/retreats/service.ts`, `src/lib/retreats/event-capabilities.ts`, `src/lib/retreats/experience-schema.ts`, `src/lib/api/types.ts`, `src/app/api/admin/retreats/route.ts`, `src/views/admin/retreat-create.tsx`, `src/views/admin/retreat-formats.tsx`, `src/lib/content/public-content.ts`, `src/app/(public)/retreats/[slug]/page.tsx`.

**New files:** `src/lib/retreats/creation-service.ts`, `src/app/api/admin/retreats/create-draft/route.ts`, `tests/unit/retreats/experience-service.test.ts`, `tests/unit/retreats/format-service.test.ts`, `tests/integration/admin/retreat-creation.integration.test.ts`; additive migration for creation-request idempotency.

- Replace the wizard's three writes with one authenticated, idempotent draft-creation endpoint. In one DB transaction create a draft page if needed, create/link the date and snapshot validated defaults. Reusing an existing page must not edit or republish it. Keep the existing endpoint compatible for other callers.
- Persist a creation-request key scoped to actor and a hash of the request, with resulting IDs. Repeating the same key/payload returns the same result; a different payload with that key returns a conflict. No external publication or email occurs inside this operation. A lost response can safely retry.
- Navigate to saved date Setup. Publishing the Event Page and opening bookings are separate, explicit steps; a draft date may reference a published reusable page. The wizard must not imply that creating a date made it bookable.
- Use experience ID for app reads/readiness/public date grouping. Update linked legacy slug snapshots transactionally when an unpublished page is renamed. Validate revision and publication state within the write so concurrent publication cannot allow a later rename.
- Resolve format defaults on the server, merge only supported explicit overrides, and persist the resolved date configuration. Include duration, timezone, venue, capacity, prices/payment mode and supported online defaults. Reject unsupported settings according to event capabilities.
- Derive end time from duration only until the administrator overrides it. Display the event timezone; do not interpret browser-local times as London silently. Test DST gaps/ambiguities and cross-midnight/multi-day events. Past dates may be stored as drafts only if current policy permits; they must not open for booking.
- Fetch legacy templates only for genuinely legacy records. App-owned online event operations must work without Contentful. If a venue editorial dependency is genuinely required and unavailable, show a targeted retryable error rather than failing unrelated attendee/payment work or passing readiness without evidence.

**Acceptance/verification:** draft rename followed by open/public lookup, rename/publish race, duplicate click, lost response, DB failure rolls back whole draft creation, repeat event keeps prior bookings/prices/content, every supported format default and override, inactive format, missing published page, unavailable CMS, invalid timezone and DST transitions. Extend `tests/e2e/app/retreats/registration-operations.spec.ts` with create/retry/repeat journeys.

### D. Establish a consistent, accessible admin shell

**Existing files:** `src/components/admin-layout.tsx`, `src/components/app-surface.tsx`, `src/components/loading-region.tsx`, `src/styles/theme.css`; reuse `src/components/ui/{sheet,dialog,alert-dialog,tabs,table,button,input,label}.tsx`.

**New files:** `src/components/admin/admin-form-actions.tsx`, `tests/e2e/app/admin-shell.spec.ts`. Add another shared component only after two real screens demonstrate the same need.

- Use View website as a normal `/` link; Sign out is an explicitly labelled action. Keep Private Studio distinct. Provide equivalent mobile navigation.
- Replace the hand-built mobile overlay with Sheet; named title/close, focus trap, Escape, return focus, scroll locking and route-close behaviour. Add skip-to-main and `aria-current` to active navigation.
- Standardise page header, one primary action, secondary actions and breadcrumb/back destination. Use real navigation links for route/query sections or complete Tabs semantics for in-page tabs, not a visual imitation.
- Preserve plum/olive identity, but reduce decorative gradients/shadows on dense operational panels using admin-scoped styles only. Use compact summary rows with readable body text; long forms use a sensible reading width instead of filling the whole desktop canvas.
- Add consistent inline field errors, error summary with focus, loading/unavailable/empty/no-results states, success announcements and pending actions. Disable only the affected action where safe.
- Long editors get a scoped save bar, explicit unsaved state, navigation protection and a meaningful discard action. Avoid claiming a save completed before the server response. Never store sensitive drafts in local storage.
- Design primary touch controls at 44px where practical; meet WCAG target-size requirements, keyboard access and visible focus. Verify contrast rather than assuming muted brand colours pass.

**Acceptance/verification:** keyboard-only mobile/desktop navigation, menu open/close/focus restore, skip link, 200% zoom and 320px reflow, long titles/errors, all actions labelled, no keyboard traps and no dashboard/public style regression. Use axe plus manual focus/reading-order checks; axe alone is insufficient.

### E. Put retreat operations ahead of setup

**Existing files:** `src/views/admin/retreats.tsx`, `src/views/admin/retreat-detail.tsx`, `src/components/admin/retreat-operations.tsx`, `src/lib/retreats/operations.ts`, `src/lib/retreats/registration-service.ts`, `src/lib/retreats/event-cancellation.ts`, `src/lib/retreats/service.ts`, `src/lib/api/types.ts`, `src/app/api/admin/retreats/[id]/cancel/route.ts` and the existing configuration, status, attendees/invite, room-assignments and balance-emails route handlers beneath that event.

**New extracted components:** `src/components/admin/retreat-setup.tsx`, `src/components/admin/retreat-cancellation-dialog.tsx`. Retain the existing operations component boundary; avoid a cosmetic mass move of unrelated logic.

- List: Create event is primary; Event pages, Event defaults (existing Formats route) and Venue rooms are secondary setup links. Persist lifecycle/status filters, sort and pagination in validated query parameters. Keep name/email search out of the URL; preserve it in session memory when returning from details. Clearly label global versus filtered totals.
- Detail: concise identity/date/timezone/status header, exact-date public link and lifecycle-aware default section. Overview starts with actionable incomplete registrations, unallocated rooms and balances due, linking to the relevant filtered workspace. Show verified counts of people separately from bookings.
- Grouped bookings remain the default attendee view. Each row/card identifies the purchaser, party size, all guests (including unnamed placeholders), each person's registration state, bed preference and room assignment. Payment total appears once per booking, not once per guest. Expand to see private details and history.
- Registration invitations/reminders are primary only for incomplete registrations. Distinguish entered guest details, invitation sent, account claim and completed required registration; never infer completion merely from a name/email. Explain partial registration with non-sensitive missing-field labels.
- Preserve booking context in people view. Explicitly scope exports: all attendees, current filtered people, or all people in selected bookings. Display count/scope before export. Room occupancy is either filtered consistently or clearly labelled as whole-event inventory.
- Online workshops show ticket counts, joining access, session/replay readiness and relevant communications. Offline ticket events must not show live-access, room or deposit language they cannot use.
- Setup uses meaningful named sections, not continued wizard numbers: Date & capacity; Rooms & prices OR Tickets & prices; Payment & extras where applicable; Review. Early-bird pricing is an optional disclosure, not the leading control. Show how changes affect existing bookings before save.
- Change readiness from strings alone to typed issues (`code`, `section`, `fieldId`, `blocking`, `message`). Link every issue to its actual section/field and focus the target. Keep a compatibility adapter while consumers migrate.
- Move cancellation into secondary Actions. Replace prompt/confirm with a Dialog summarising affected bookings/people/gifts and server-calculated refund consequences. Require a reason, prevent duplicate submission, surface partial/pending failures and never promise all refunds are complete before confirmation from the service.

**Acceptance/verification:** one person buys twin-configured king room for two; admin sees both guests together and their different registration states immediately. Two people count as two places but one payment/room allocation. Cover guests sharing an email, unnamed guest, purchaser not attending, gifted place, cancelled booking, partial refund, overcapacity conflicts, completed/past event, invalid saved section and no search results. Existing privacy and bed-preference regressions must remain green.

### F. Simplify venue, content and public preview journeys

**Existing files:** `src/views/admin/retreat-venues.tsx`, `src/views/admin/retreat-create.tsx`, `src/views/admin/retreat-experience-editor.tsx`, `src/views/admin/retreat-experiences.tsx`, `src/views/admin/retreat-formats.tsx`, `src/app/api/admin/retreats/venues/[venueId]/route.ts`, `src/lib/retreats/images.ts`, `src/lib/retreats/presentation.ts`, `src/components/markdown-content.tsx`, `src/views/retreats.tsx`, `src/views/retreat-detail.tsx`, `src/views/retreat-checkout.tsx`, `src/components/retreat-bed-preference.tsx`.

**New files:** `src/components/admin/retreat-image-field.tsx`, `src/app/(app)/admin/retreats/experiences/[experienceId]/preview/page.tsx`.

- Venue overview shows saved physical rooms and capacity, an explicit Edit/chevron and a separate unsaved indicator. Keep per-venue/group disclosures manageable. Save bar stays associated with that venue. Summarise removals/capacity changes and enforce server-side protection of in-use stock. Explain that existing event configurations are not silently replaced by venue defaults.
- Explain room setup in ordinary terms: physical rooms; beds in each room; individual shared places versus booking a whole room; available guest counts. Convertible beds mean the purchaser can choose one double/king arrangement or two single beds where supported, without creating duplicate physical inventory.
- Event editor groups Story, Image, Schedule & atmosphere and Publishing. Reuse one image field with alt text, focal controls and card/detail previews. Missing required image metadata is an inline error, not a silent removal. Keep URL entry available; reuse an existing authenticated asset selector if present, but do not add a new media-management platform to this scope.
- Keep the schedule as one Markdown textbox with a short example and rendered preview. Preserve sanitisation, headings, lists and emphasis. Do not render raw untrusted HTML.
- Draft preview is admin-authorised, non-indexed and uncached/private; it must use the actual draft and selected event date without exposing a public draft endpoint. Reuse public presentation components with explicit supplied data, not a second renderer.
- The public list and admin preview use the same focal calculation and price/date presentation helpers. Verify Shruti's face in the supplied image at mobile and desktop crops. Exact-price workshops use `£35`; variable accommodation uses `From £425` only when appropriate. Admin labels distinguish normal/early-bird prices only when different and applicable, never `From £425 / £425`.

**Acceptance/verification:** dirty venue edit/discard/save, last-room removal, booked-room reduction, convertible bed selection retained through payment/admin/email, image with missing alt, portrait/landscape crops, two dates on one page, Markdown emphasis and multi-day headings. Extend `tests/unit/retreats/{images,presentation,venue-room-groups}.test.ts`, `tests/unit/content/markdown-content.test.ts`, `tests/e2e/public/retreats/{journeys,powis-house}.spec.ts` and the admin retreat E2E slice. Seed fixtures locally/sandbox only when separately authorised; never reset real bookings.

### G. Make member and coaching work task-focused

**Existing files:** `src/views/admin/members.tsx`, `src/views/admin/member-detail.tsx`, `src/lib/admin/members-service.ts`, `src/views/admin/coaching.tsx`, `src/lib/coaching/service.ts`, `src/lib/coaching/operations.ts`, `src/lib/api/types.ts`, `src/app/(app)/admin/coaching/page.tsx`, existing member and coaching API handlers under `src/app/api/admin/`.

**New files:** `src/app/(app)/admin/coaching/[applicationId]/page.tsx`, `src/views/admin/coaching-detail.tsx`, `tests/e2e/app/admin-people.spec.ts`.

- Members: labelled search, status filter and More filters disclosure, selected filter chips and explicit no-results/clear actions. Keep the existing server-owned risk classification; show the reason and next useful action rather than another unexplained badge. Do not duplicate classification in the client.
- Member details: overview/membership/activity/notes first; authorised health context is easy to reach but not displayed indiscriminately. Move roles/security and privacy into explicit Access & privacy navigation. Preserve role checks at endpoints, not only by hiding controls. Confirm high-impact permission/privacy changes and keep the existing audit trail.
- Use a message dialog instead of inserting a large compose form above the whole record. Keep consent, delivery status and transactional/marketing distinctions visible.
- Coaching: compact stage list with name, relevant support level, next action and due/overdue state. Open one client detail instead of auto-expanding every record with work. Add a canonical detail route; preserve existing `application` query deep links by resolving them to that record. Reuse current action endpoints.
- Client detail begins with the operational checklist and one primary next action. Historical enquiry answers and completed steps are disclosures. Website status, billing and Everfit access remain separate authoritative states, with explicit wording about what each action changes.
- Replace stacked browser confirmations with one contextual confirmation for a consequential action. Pending/failure states must not erase the form or falsely advance the workflow.

**Acceptance/verification:** return to list keeps stage/filter context; direct link and deleted/unauthorised record; member without membership; no account yet; consultation not booked; waiting list; payment pending; active client with onboarding outstanding; stopping billing does not imply removal from Everfit. Role/privacy tests verify no privilege expansion or leakage of another attendee's health details.

### H. Separate newsletter and business tasks

**Existing files:** `src/views/admin/newsletter.tsx`, `src/views/admin/campaign-detail.tsx`, `src/lib/admin/newsletter-service.ts`, `src/views/admin/business.tsx`, `src/lib/admin/business-service.ts`, `src/lib/billing/refund-service.ts`, `src/lib/billing/dunning-service.ts`, `src/app/api/admin/business/{route.ts,reconcile/route.ts,catalog/price/route.ts}`, `src/app/api/admin/billing/{refunds,dunning}/route.ts`.

**New files:** `src/components/admin/business-refund-form.tsx`, `tests/e2e/app/admin-business-newsletter.spec.ts`.

- Newsletter gets Campaigns and Audience navigation with remembered non-sensitive filters. Campaigns lead with needs-attention work; audience metrics belong to Audience. Provide an explicit Contentful edit link for editorial work. Friendly status labels must preserve the difference between provider acceptance, delivery, failure and uncertainty.
- Recipient reconciliation UI follows package B. No global “all sent/not sent” shortcut without explicitly selecting reviewed recipients and confirming the scope. Explain safe next steps instead of leading with provider stream terminology.
- Business section navigation renders independently of any dataset. Each section owns loading/error/retry/empty state and loads its data on entry. A failed overview cannot hide pricing, settings or billing. Aborted/stale requests must not replace newer filter results.
- State the scope of financial figures: for example coaching subscription projections, not total business revenue. Expand MRR/MTD in labels/help, show last successful sync and distinguish stale/missing from zero. Keep Stripe sync explicit and audited.
- Replace raw Membership ID and pence refund entry with authorised member/subscription/payment selection, eligible refundable amount, pounds input and server-verified preview/confirmation. Reuse billing service rules and idempotency; do not add a second refund implementation. Keep IDs in optional diagnostics. UI pounds convert exactly to integer pence; reject invalid precision/negative/excess amounts.
- Pricing changes explain future-sales versus existing-subscription impact. Refresh authoritative records after dunning extension, refunds and settings writes; preserve inputs on failure. Owner/finance capability checks remain in the API.

**Acceptance/verification:** overview error with working Settings tab, slow/out-of-order loads, sync denied/failed, missing projection not £0, £12.34 becomes 1234 pence, partial/already-refunded payment, duplicate refund submission, failed provider action, successful dunning update shown immediately, subscriber unsubscribed after campaign preparation and no accidental marketing consent changes.

### I. Finish shared operational polish: dashboard, audit and moderation

**Existing files:** `src/views/admin/dashboard.tsx`, `src/lib/admin/dashboard-service.ts`, `src/lib/admin/email-delivery-service.ts`, `src/views/admin/audit.tsx`, `src/views/admin/blog-comments.tsx`, `src/app/api/admin/audit/route.ts`, `src/app/api/admin/blog/comments/route.ts`.

- Replace static system-presence metrics with verified work counts/links or remove them. Loading/unavailable email or coaching data cannot read “Clear”. Show source-specific retry without hiding other dashboard information.
- Label audit filters and use supported action/target options with human names. Preserve raw values in details, link targets where authorised and explain CSV scope. Failed requests show an error rather than an empty audit history; add pagination where the service limit would otherwise hide older results.
- Moderation gets labelled search/status, meaningful empty states, retained filters and contextual deletion confirmation. Inspect actual delete semantics before promising undo/recovery. Hiding versus deleting and effects on thread replies must be explicit.

**Acceptance/verification:** disconnected endpoint, real zero, slow request, stale filter response, pagination/export scope, deleted target links and parent comment with replies. Shared-shell checks cover existing classes/programmes routes without changing their operational rules.

## 6. Execution order and delivery gates

| Order | Work | Gate before proceeding |
| --- | --- | --- |
| 0 | Capture baseline and failing regressions | Record current dirty files, reproduce R1–R8 with fixtures, establish authorised test environments. |
| 1 | A and B: import/send safety | Published drafts cannot leak; app edits cannot be overwritten; interrupted campaigns recover without blind retry. |
| 2 | C: identity, defaults and creation | Draft creation is atomic/idempotent; app dates remain linked; CMS-independent operations pass. |
| 3 | D, then E and F | Accessible shell; grouped guest operations and lifecycle setup journeys pass; public cards/checkout remain correct. |
| 4 | G and H | Members/coaching next actions are clear; business tabs fail independently; campaign recovery UI matches server capabilities. |
| 5 | I, full verification and docs | No false “all clear” states; documented ownership and tested rollout/rollback procedure. |

Use small work-package changes, not one monolithic rewrite. Each package gets regression tests and a reviewable diff. Do not call a package complete based only on visual improvement when its recovery or permission cases are untested.

## 7. Verification and rollout checklist

- Read applicable `AGENTS.md` and relevant `node_modules/next/dist/docs/` guidance before implementation. Use Node 24, existing aliases/components/service boundaries and no new `any`.
- Before editing, inspect staged/unstaged/untracked work and preserve unrelated changes. Never reset this working tree or overwrite user edits to establish a clean baseline.
- Start with the smallest Vitest slice for each change; run real local-DB integration tests for uniqueness, transaction rollback, snapshots and concurrency. Mocks alone do not prove those properties.
- Run `pnpm run typecheck`, `pnpm run lint`, affected unit/integration suites and focused Playwright journeys. Run the production build after the combined route/component changes. Record exact commands, results and unrelated pre-existing failures; do not reuse an earlier run as evidence for later changes.
- Run browser journeys at 390px, 768px and 1440px, plus 320px reflow and 200% zoom. Include long names/titles, many guests, no data, no matches, errors, loading and pending mutations. Check image crops visually using the supplied photographs.
- Add axe checks for admin shell, draft/live residential event, online workshop, members, coaching, newsletter recovery and business sections; retain public retreat accessibility checks. Manually test keyboard/focus, dialog recovery and status announcements.
- Use deterministic local fixtures: two guests in a convertible king room with different registration states; purchaser not attending; gifted booking; partly paid/cancelled/refunded booking; repeated page with two dates; all four event kinds; campaign with mixed ambiguous/failed/accepted recipients; member without membership; coaching onboarding incomplete; stale business projections.
- Never send real newsletter/registration messages or issue real refunds during automated verification. Use mocked providers/test credentials. Do not copy guest health information into screenshots or test artifacts.
- Inspect schema diffs for additive/backward-compatible rollout. Apply local migrations and verify backfills. Remote migration/import execution is a separate explicitly targeted developer operation; no staging/production `db push` and no automatic migration in CI/Vercel.
- Before remote import, export/backup affected records, produce a dry-run conflict report, verify exact source environment/locale and compare actual published/draft snapshots. Obtain approval for conflicts or repairs. Do not delete legacy Contentful types/entries as part of this remediation.
- Keep old API consumers compatible while endpoints/DTOs transition. Deploy additive DB changes before dependent code. Rollback must not re-enable unsafe sending/import paths or discard new attendee records; document how old code interacts with newly persisted states before release.
- Update `docs/admin-operating-model.md`, `docs/retreat-admin-workflow.md`, `docs/contentful-model-ownership.md`, `docs/contentful-newsletter-automation.md` and relevant sandbox instructions to describe verified behaviour, not intended behaviour.

## 8. Definition of done

An administrator can create/repeat an event without re-entering defaults or recovering orphaned records; open bookings through a clear checklist; immediately see both guests and registration progress in a two-person booking; operate workshops without irrelevant room controls; and reach setup only when needed. Draft content remains private, reimports respect app ownership, and interrupted sends have an evidence-based recovery path. Members/coaching expose the next action, business failures are isolated, money is entered in pounds, and no unavailable service is presented as a healthy zero. These outcomes are demonstrated by the tests and browser checks above, with any remaining limitations explicitly recorded.
