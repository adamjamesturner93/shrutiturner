# Private Studio UX review

12 September 2026. Scope: lobby, retreats/workshops, coaching, account, health profile and shared
dashboard navigation. This is a source-based review plus the supplied Health Profile screenshot,
not a claim that every signed-in state has been browser-tested. Recommendations below are not yet
implemented. The public hover fixes and compact day-retreat checkout were handled separately.

## Direction

Treat the studio as a task workspace, not another marketing site. Lead with the next appointment or
action, use compact headings, and reveal supporting details when needed. Keep the existing colours,
typography and service boundaries. Do not remove consent, identity or safety requirements to shorten
a page; distinguish required-before-attendance tasks from optional profile improvements.

## Recommended order

### 1. Shared navigation and accessibility — high priority

Files: `src/components/dashboard-layout.tsx`, `src/components/app-surface.tsx`,
`src/styles/theme.css`.

- The mobile navigation is a bespoke overlay with an unlabelled close icon, rather than the existing
  accessible Sheet component. Replace it with Sheet, including focus trapping/restoration, Escape,
  background scroll locking and a labelled trigger/close control.
- Active links have visual styling but no `aria-current`. Add it, a skip-to-content link and a stable
  main-content target. Keep only one current navigation destination; hover must look distinct from
  selection (the screenshot makes Account and Health Profile appear simultaneously selected).
- Add an explicit compact variant to AppPageHeader. Use it on routine studio pages; do not globally
  shrink marketing headers or change every consumer of the shared component unintentionally.
- Rename the member navigation destination to “Retreats & workshops”, matching what it contains.

Acceptance: keyboard-only entry/exit of the mobile menu; one current item; no background focus while
open; 320px reflow and 200% zoom; visible high-contrast hover/focus states; axe passes.

### 2. Event bookings: organise around the event, not database roles — high priority

Files: `src/views/dashboard/retreats-list.tsx`, `src/views/dashboard/retreats-portal.tsx`,
`src/views/dashboard/retreat-registration.tsx`, `src/views/dashboard/workshop-setup.tsx`;
DTO/service changes, if needed, remain in `src/lib/retreats` and `src/lib/api/types.ts`.

- The list separates “My registrations” from “Bookings I manage”. The same event can appear in both.
  Group by the booking/selected date while retaining the distinction between purchaser and attendee.
  Show “You + Alex”, each registration status, room/bed choice where relevant, and one next action.
  Do not group by title alone: different dates and multiple purchases must remain distinct.
- “Your Retreats” and the portal's unconditional “Room”, “Balance due” and emergency-contact summary
  inherit residential assumptions. Use event capabilities: online = join/setup/replay, day event =
  venue/arrival/ticket, residential = room/guests/balance. Hide irrelevant or empty rows, not real debts.
- Put the imminent action first: finish registration, pay a due balance, join, or view replay. Keep
  receipts, cancellation, payment history and historical events secondary. Never present “Join” as
  enabled before server eligibility allows it.
- Preserve the selected date in public-detail links (the list currently links by slug only).
- Replace gift cancellation `window.prompt` and portal cancellation `window.confirm` with contextual
  dialogs: event/date, consequences, review-versus-immediate cancellation, reason and pending state.
- Bookings and gift fetches currently fail together in the client fallback. Isolate errors and offer
  retry per section so a gift-service failure cannot hide the customer's booking.

Acceptance: purchaser/attendee/both roles; two guests with mixed registration status; gift recipient;
two instances with the same title; fully paid, deposit, overdue, cancelled and refunded; live workshop
before/during/after; partial fetch failure. Private health answers must never be exposed to the other
guest or purchaser merely to explain an incomplete status.

### 3. Lobby: “What do I need to do next?” — high priority

Files: `src/views/dashboard/lobby.tsx`, `src/views/dashboard/dashboard-view-model.ts`, relevant
dashboard summary service/DTO (trace existing API before extending it).

- Preserve the existing “Your next actions”, “Coming up” and service links, but prioritise one primary
  action and a short secondary list. Put the next dated event immediately underneath.
- The introduction describes 1:1 support even for workshop-only customers. Make the copy neutral or
  service-aware. Avoid a generic coaching-first welcome for a person who just bought a workshop.
- The onboarding journey includes welcome/referral/health steps, while account and event setup also
  prompt for completion. Use one canonical readiness state with precise links to the missing field.
  Optional “Where did you hear about me?” must not compete with an imminent event task.
- Do not turn an unavailable summary into a vague centred dead end. Show a retry action and safe links
  to bookings/account; do not display invented zeros or claim the account is empty.

Acceptance: new workshop-only customer, active coaching client, customer with both, no services,
stale agreements, incomplete optional profile, and summary API failure. No duplicate action cards for
the same requirement; returning from setup preserves the intended booking/join destination.

### 4. Account and health: less status furniture, clearer editing — medium priority

Files: `src/views/account.tsx`, `src/views/dashboard/health-profile.tsx`,
`src/components/app-surface.tsx`, shared health editor and existing account/health services.

- Account places a large header, three status columns and an onboarding panel before editable details.
  Replace healthy status cards with a short summary; reserve banners for actual problems.
- Account tabs are plain buttons and reset to Profile on refresh. Reuse accessible Tabs or section
  links with allowlisted URL state. Support direct links to profile, preferences and notifications;
  add save/discard feedback and guard unsaved changes before changing sections.
- The email summary literally says “Verified sign-in”. Derive that wording from the verified email
  state, including pending replacement, rather than relying on a general assumption about sign-in.
- Keep sign-in/email verification separate from marketing preferences. Destructive actions must be
  secondary, with specific confirmation; preserve verification, consent versioning and audit evidence.
- Health Profile's empty state has both “Edit” in a large hero and “Complete declaration” below.
  Show one primary “Complete health profile” action when empty; show Edit only when data exists.
  Replace “so booking and join flows can use the right prompts” with customer language, e.g.
  “Share anything Shruti should know before your session.” Explain what is required without implying
  an optional answer is mandatory. Use the same label (“health profile”) consistently in navigation.
- Once completed, show last-confirmed/review-needed status above concise sections. Keep sensitive
  information out of lobby cards and collapsed by default where appropriate, with an explicit way
  to inspect and edit it. Do not hide required review actions.

Acceptance: empty/saved/review-required profiles, consent refresh, save failure, pending email change,
keyboard tab navigation, reload/back behaviour and unsaved edit protection. No change to retention,
privacy or clinical/safety decisions in a presentation-only pass.

### 5. Coaching: state-first presentation — medium priority

Files: `src/views/dashboard/coaching.tsx`, existing coaching next-action/service DTOs.

- Keep the existing next-action logic and cancellation/waitlist dialogs. Avoid a wholesale rewrite of
  a page which already handles several lifecycle states.
- Present a compact status and one main action for application submitted, waitlisted, offer ready,
  active, paused and ending. Put pricing/change history and agreement detail in disclosures.
- For an active client, make the actual coaching destination (Everfit where configured) prominent,
  alongside contact/next session. A generic external homepage link is less useful than their configured
  destination; do not invent links when no integration URL exists.
- Keep billing/cancellation easy to find but visually secondary. Show failed-payment or time-limited
  offer notices as exceptions, not permanent warning panels. Add retry to the no-data error state.

Acceptance: each lifecycle state and failed service response, pending payment, changed offer, existing
legal acceptance flow, keyboard dialogs and non-duplicating submissions. No real payments/emails during
automated tests.

## Architecture and delivery constraints

Most of this needs **no database migration and no Contentful model change**. Studio navigation,
operational status and permission checks belong in the app, not the marketing CMS. Reuse the current
server services and capability/readiness logic; introduce DTO fields only where the UI genuinely lacks
authoritative information. Never calculate join eligibility or payment status from decorative labels.

Deliver in small slices: shell/accessibility → event cards/portal → lobby → account/health → coaching.
For each: fixture-led browser coverage for role/state variations, mobile/desktop screenshots, hover and
keyboard focus checks, axe, relevant service tests, typecheck and lint. Visually verify desktop density
without enforcing a no-scroll promise at zoom, on small screens or for longer health forms. Review the
existing admin remediation backlog separately; this dashboard review does not declare it complete.
