# Prioritised implementation batches

Working-tree changes only. **No deployment, remote migration, Contentful write, real email or refund.**
This is a progress record, not a declaration that all review items are complete.

## Priority 1 — safety

Implemented in this continuation:

- Next.js and eslint-config-next: 16.3.1 → 16.3.5 (stable registry tag). The lockfile and pnpm's
  exact-version release-age exceptions were updated together; React and unrelated direct dependencies
  were not intentionally upgraded.
- Membership refunds now reserve capacity under a membership row lock before calling Stripe. A
  deterministic existing BillingRefund primary key identifies the request. Credits, refund and audit
  reservation are atomic. Provider calls stay outside transactions. Concurrent/repeated attempts use
  the same Stripe key; a different request cannot bypass an unresolved invoice operation. An ambiguous
  request older than 23 hours requires reconciliation, since provider keys can expire after 24 hours.
- Owner-authorised latest-invoice selection, exact pounds parsing, review/confirmation and same-request
  retry. Invoice identity is checked again on submission. This does not support arbitrary historical
  Stripe payments: the screen explicitly limits itself to latest invoices for 100 recent memberships.
- Local PostgreSQL tests cover over-capacity races, concurrent retries, timeouts, expired keys and
  atomic credit issuance. All Stripe responses are mocked.
- Newsletter local PostgreSQL tests cover concurrent retries, provider timeouts, stale reconciliation
  evidence and crashed-worker leases. No Postmark sends occur.
- Contentful import dry runs now report draft/published hashes, app revision, populated unsupported
  fields (including galleries) and additional locales. Apply fails before writing if conversion would
  silently drop this data. This deliberately blocks, rather than invents, a loss-prone conversion.

Reviewed source changes can now be explicitly applied to the app **draft only** using
`--reviewed-updates=/path/to/review.json --apply`. The JSON object is keyed by Contentful entry ID;
each approval contains `expectedRevision`, `expectedAppDraftHash`, `expectedSourceDraftHash` and
`expectedSourcePublishedHash` (nullable), copied only after reviewing both snapshots. Dry-run output
provides these values. App revision and draft hash are checked again under a row lock. Published
content/dates/stock remain untouched; publishing the new draft is a separate app action. Identity,
provenance and conversion-loss conflicts still block this mechanism. Each event update is atomic;
the whole multi-entry import is not a distributed transaction. No reviewed update was executed here.

Still open: full linked-asset/locale fixtures and rehearsal of reviewed updates; historical CMS and
campaign audit; recovery browser fixtures; real Stripe **test-mode** end-to-end release rehearsal;
provider-verified reconciliation UI for old ambiguous membership refunds. The payment UI must not
promise recovery after its safe replay window. Pending invoice reservations must not be manually
deleted merely to enable another refund.

## Priority 2 — customer dashboard

Implemented:

- Shared mobile navigation uses the existing Sheet (focus containment, Escape, trigger restoration),
  named navigation, current-page semantics and a keyboard skip link. Reduced main padding.
- Opt-in compact headers for lobby, coaching, account and health; no global marketing redesign.
- Lobby wording includes workshop-only members; lobby/coaching failed loads provide a retry.
- Account section links survive reload/back with allowlisted URL values. Account status is secondary;
  the unverifiable “Verified sign-in” claim has been removed. No health data is stored in the URL.
- Empty health profile has one completion action and customer-facing wording.
- Booking and gift loads fail independently on server and client; unavailable data is not labelled an empty booking list.
- Guest names and registration status are grouped under their booking; own registration actions are
  linked there and duplicate standalone cards are removed. No other guest's health answers are exposed.
- Gift/booking cancellation uses contextual dialogs with pending state, retaining review semantics.
- Public event links retain date IDs. Empty room/emergency details and irrelevant balance deadlines
  are hidden. “Fully paid” only appears for the actual paid-in-full status.

Still open: comprehensive grouping/guest-role browser coverage; canonical lobby
readiness and optional onboarding priority; comprehensive account unsaved/discard guards; coaching
lifecycle/destination refinement; all role/state/privacy browser cases and visual review at zoom.

## Priority 3 — admin

Implemented:

- Newsletter failures are caught and displayed independently; late responses cannot replace newer
  filter results. Status/range filters use allowlisted URL state. Search text is not persisted.
- Business reconciliation/grace-period actions refresh their section; future-price impact is explicit.
- Audit API bounds page size/offset, uses stable ordering, and escapes spreadsheet formula prefixes.
  UI pagination and “Export this page” describe the actual 100-row filtered export scope.

Still open: field-linked readiness, wizard unsaved guards and all-format/DST browser fixtures;
authorised private public-layout preview; inventory change/removal impact guard review; remaining
members/coaching filter return context and consequential actions; moderation retained filters;
historical Contentful editorial cleanup. Do not delete historical CMS entries automatically.

## Deployment and rollback gates

1. Preserve staged work and review the combined diff. Do not use this record as approval to deploy.
2. Before deploying refund changes, pause admin refund actions and drain old application workers:
   old code does not use the new reservation protocol. The refund change needs no schema migration.
3. Before enabling new newsletter recovery workers, disable send-trigger entry points (publish webhook,
   scheduled sends and manual retries), let in-flight calls settle, and inspect campaigns with a lease
   or `sending` delivery. Lease expiry alone is not evidence that a message was not sent.
4. Match ambiguous deliveries against provider records using campaign/delivery identifiers. Confirm
   delivered or not-sent individually with evidence; never reset all ambiguous deliveries to queued.
5. Apply the previously prepared additive migrations only with explicit target approval and the repo's
   staging/production migration scripts. No `db push`; no migration from CI/Vercel.
6. Rollback requires keeping sending/refund entry points disabled. Do not resume old workers against
   new pending reservations or recovery records: old workers do not honour those protocols.
7. Test anonymous, signed-in, gift, two-guest twin/double, sold-out, selected-instance and optional-extras
   flows. Check payment → confirmation → registration → admin using test-mode providers only.
8. Historical audits and the worker-drain procedure are **not yet rehearsed on a remote environment**.

The local read-only audit found two imported event records without full provenance (revision 2), no
incomplete Contentful campaigns and no unresolved membership refunds. Neither record was changed.
Re-run with `node --env-file=.env --experimental-strip-types scripts/audit-remediation-safety.ts`.
The command refuses non-local database hosts and never calls providers or repairs records.

Verification results will be updated after the current local checks complete.
