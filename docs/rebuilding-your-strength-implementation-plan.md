# Rebuilding Your Strength — corrected v1 implementation plan

Status: implemented on `feat/rebuilding-strength-cohorts`; final verification recorded below. This document retains corrected v1 and the final independent-workout and batch-clearance amendments.

## Scope and architecture

- Reuse existing small-group runs, enrolments, Stripe, Daily, replay, health, legal, email and job services. Add a reusable Programme definition and cohort-specific snapshots/content.
- Preserve coaching, classes and retreat/workshop checkout. No broad retirement, billing rewrite or Contentful migration.
- Independent account relationships drive Dashboard | conditional Coaching | conditional Programmes | conditional Events | Account. Events combines workshops and retreats; admin access is separate.
- Priority: required actions, next seven days, coaching tasks, new content, active services, future events, history, at most one public-sales discovery card.
- Cohort states: Draft, On Sale, Confirmed, Active, Follow-up Access, Archived, Cancelled. Sales availability is separate. Never activate an unconfirmed cohort.
- Separate live-coaching end, structured-programme end and follow-up-access end. Access is checked on requests, not dependent on jobs running.

## Purchase and health

- Guest/existing account purchases, purchaser != participant and existing gifts remain supported. Payment does not verify email. Capacity reservations and payment fulfilment are idempotent; expired/late payments and refunds have tracked recovery.
- Checkout collects identity, billing, purchase terms/refund acceptance and acknowledgement of later screening. Authenticated onboarding collects health and exercise agreements.
- Reuse one current health profile, confirmed separately for each offering and tied to its revision. No automatic new clearance.
- States: pending participant confirmation, ready for clearance, pending coach review, cleared, cleared with considerations, not currently cleared. Superseded revisions cannot authorise exercise.
- Safe batch review applies only to Ready for clearance; recheck every revision/trigger and audit each decision. Pending coach review requires individual review.
- Membership, access period and exercise clearance are independent. Education, calendar and open community remain available without clearance. Workouts, exercise live/replays/demonstrations/downloads require clearance server-side, including community references. Health details never enter community/general dashboard/email payloads.

## Programme content and operations

- Home | Weeks | Live | Community | Resources; onboarding directly reachable. Monday education has its canonical home on the Week page and a community announcement links to it.
- Independent workouts have separate availability. Every exercise must have planned teaching in this or an earlier session, or an authorised demonstration; reject unsupported novel exercises at publication.
- New exercises unlock only after actual cohort-level teaching and an available replay/demonstration. Never use individual attendance. Previously taught/demonstrated exercises can unlock before this week's live session. Before release show an explanatory waiting state. Future week bodies/media never enter participant responses.
- Private text community: participant post/reply/edit/delete own; staff pin/announce/lock/moderate and reference authorised resources. No participant uploads or individual form-analysis promise.
- Pinned welcome, introductions, guidelines, exercise questions; opening prompt Monday and Friday reflections. Jobs publish without staff presence, including 26 February after live coaching ends.
- Reuse Daily private rooms and recording services; temporary authorised playback only. Show processing/unavailable states.
- Use ordinary all-session .ics downloads and existing email delivery: welcome, conditional onboarding, pre-start Friday, optional 24h/1h, closing, access-ending, cancellation/refund. Suppress duplicates, obsolete messages and unrelated recipients.
- Admin can confirm early/below minimum or cancel. Cancellation blocks sales/access/messages and tracks refund success/failure/retry. No automatic count-based decision.
- Follow-up retains old content/community with an explicit no-new-workouts/live/coaching banner. Expiry retains purchase history but denies protected resources. No access extensions or read-only archive.
- Optional alumni credit: configurable amount/eligibility/deadline/services, manual audited one-use redemption; no automatic pricing change.

## January draft

Programme: Rebuilding Your Strength. Cohort: Rebuilding Your Strength — Jan '27. Europe/London throughout.

- Starts 25 January 2027; releases 25 January, 1/8/15/22 February.
- Last live-coaching day 25 February; final reflection 26 February; structured end exclusive 27 February 00:00.
- Follow-up expires 1 April 00:00 Europe/London (31 March 23:00 UTC).
- Minimum 4; provisional confirmation 18 January 09:00, community 22 January 09:00, enrolment closes 24 January 18:00.
- Remain Draft until price, maximum capacity, valid five-session schedule, sales copy, equipment and refund wording are supplied. No real price/capacity or credit amount assumed.

## Fixtures and tests

Use all supplied A–O example.test identities (Alex, Casey, Priya, Jamie, Morgan, Taylor, Robin, Sam, Drew, Jordan, Avery, Riley, Pat, Gift Participant and Test Coach), all nine independent cohort states, abstract health A–D, five named weeks and the invalid Novel Exercise Without Demonstration fixture. Synthetic test commercial values never populate the launch draft.

Inject a server-side application clock. Isolate time-sensitive fixtures and use real application authorisation/database paths with external-provider test adapters; no production time/auth bypass.

- [x] E2E-01 account only
- [x] E2E-02 new-account purchase
- [x] E2E-03 existing-account purchase
- [x] E2E-04 all entitlements
- [x] E2E-05 incomplete health
- [x] E2E-06 pending review
- [x] E2E-07 coach clearance
- [x] E2E-08 future-week API/UI protection
- [x] E2E-09 exercise evidence publication validation
- [x] E2E-10 live authorisation
- [x] E2E-11 replay/direct resource protection
- [x] E2E-12 community before opening
- [x] E2E-13 participant text controls
- [x] E2E-14 coach moderation
- [x] E2E-15 community cannot bypass clearance
- [x] E2E-16 scheduled Friday prompts
- [x] E2E-17 follow-up access
- [x] E2E-18 expiry/history
- [x] E2E-19 below-minimum admin decision
- [x] E2E-20 cancellation/refunds
- [x] E2E-21 one-use alumni credit
- [x] E2E-22 purchaser != participant privacy
- [x] E2E-23 mobile entitlement navigation
- [x] E2E-24 education before live, workout withheld, teaching/replay ready, unlock without attendance, references work, uncleared still denied
- [x] Unit/integration entitlement permutations, clearance/revisions/batches, lifecycle/DST, payment races/retries, emails/privacy, refunds and concurrent redemption
- [x] Axe dashboard/home/week/onboarding/community/live + keyboard/mobile
- [x] Typecheck, lint, relevant unit/integration and Playwright; report failures/skips honestly

## Delivery

Models/access → fixtures/clock/dashboard → purchase/onboarding → clearance → content/teaching → live/replays → community → communications/calendar → confirmation/refunds → follow-up/expiry → credit → complete verification.

Additive backward-compatible migrations only; staging/production deployment remains manual via existing scripts. Preserve historical records and route compatibility. Summarise delivered files, actual test results and residual risks before completion.

## Implementation and rollout notes

- Additive migrations: `20260915090000_programme_cohorts` and `20260915100000_event_offering_clearance`. Applied to local PostgreSQL only. Apply staging/production migrations manually using the existing env-specific deploy scripts before deploying dependent code.
- Existing event runs retain their established health setup workflow. New event runs default to offering-specific clearance. Event participants confirm their existing profile from Events; authorised event staff review under the event's Health clearance link. Live tokens and replays enforce the decision server-side. No event checkout replacement is required.
- `pnpm run seed:programmes` creates the January Draft idempotently. `pnpm run seed:programmes -- --fixtures` also resets synthetic local fixtures; fixture reset refuses remote databases. For a manually selected remote environment, run `node --env-file=.env.staging --experimental-strip-types scripts/seed-programme-cohorts.ts --draft-only` (or the explicit production env file). Never load remote credentials into default `.env`.
- Before opening sales, supply the real price, capacity, complete sales/refund/equipment copy and valid weekly live schedule. The seeded launch cohort intentionally has no price/capacity and cannot be purchased.
- Configure the existing infrastructure scheduler to POST `/api/internal/jobs/programme_maintenance` every five minutes with `Authorization: Bearer <INTERNAL_JOB_SECRET>`. Continue the existing transactional email retry job. Publication/notifications happen on the first successful run at or after their configured time; no staff login is needed. Access boundaries themselves are enforced on every request, independently of scheduler health.
- Confirm Stripe success/delayed-success and refund-update webhooks plus Daily recording webhooks in the target environment. Automated verification uses isolated local provider adapters and real application fulfilment/access paths; no live card charge, email delivery or paid video call was made.
- Replay access uses [Daily's temporary access links](https://docs.daily.co/reference/rest-api/recordings/get-recording-link), minted after server checks. Recording registration verifies the provider recording and room; standalone demonstrations require an admin's explicit authorisation. The webhook accepts Daily's documented nested payload and retries failed synchronisation.
- The existing account onboarding wizard remains available at `/dashboard?onboarding=true`; normal dashboard visits use the entitlement hub.
- The existing browser authentication fixture now issues the same encrypted JWT format as the application's Auth.js session strategy. It no longer inserts obsolete database-session cookies. Passwordless login itself is exercised in programme E2E-01/02 and existing auth journeys.

### Verification commands and results

- `pnpm run test:unit`: 676 passed.
- `pnpm run test:integration`: all 98 passed across 23 files, including all 40 programme integration tests. Repeat-run fixture cleanup is covered.
- `pnpm run test:e2e:programmes`: all 25 passed (24 numbered critical journeys plus six-page axe audit), including mobile account-only/all-entitlements navigation.
- `pnpm run typecheck`: passed after regenerating route types.
- `pnpm run lint`: no errors; three existing warnings in unrelated booking/auth components.
- Final programme UI rerun: all five selected checks passed (account-only dashboard, incomplete health, follow-up, teaching-based workout release and six-page axe audit).
- Existing retreat browser regressions: four passed. Existing account regressions: all four passed across the final reruns after updating stale selectors, current-consent fixtures and waiting for the preference-save response. No production account UI changes were required.
- Loading-boundary unit rerun after preserving account onboarding: 28 passed.
- The entire pre-existing site-wide Playwright suite was not rerun; the programme suite and relevant account/retreat journeys were exercised.

The public programme catalogue, participant hub, cohort administration, private community, health confirmation, payment/refund handling, emails/calendar and tests live in the existing app/service structure. No remote deployment or branch push is part of this change.
