# Powis room selection and cleanup — 5 October 2026

## Customer rules

Choose guest count (1 or 2), room/privacy and bathroom, then king/twin where relevant for two-person private bookings. Shared places always mean one twin bed for one attendee. Solo private bookings default to king in convertible rooms. Sold-out categories and normally supported configurations remain visible and labelled.

The five physical rooms are Green (fixed king, private bathroom), Grey and Yellow (convertible, private bathroom), Beige (fixed twin, shared bathroom), and Blue (convertible, shared bathroom). Shared/private offers compete for the same physical inventory. A first shared booking blocks private sale of that room; its second bed remains available. A private booking for either occupancy blocks all its beds.

Pending payment holds and purchased gifts consume inventory. Room assignment packs unassigned shared reservations together and preserves existing physical assignments. Checkout checks physical capacity under the existing inventory advisory lock, preventing private sales against free beds spread across occupied rooms.

## Production cleanup

The explicitly requested unused draft `cmu77atta000a04jvsjpnbk33` was deleted after a read-only dependency audit and recovery export. It owned one date, five room options, eight rates, five room units, five inventory pools, one addon and five deposit rules. No customer dependencies were present. The open event `cmu887mpm000004jqm7l77eze` and its shared venue groups were verified unchanged.

Recovery export: `/tmp/powis-draft-recovery-1791203075542.json`. Keep a durable private copy if required; temporary-directory exports are not permanent backups. No schema migration was needed.

`node scripts/cleanup-powis-draft.mjs` is a dry run against the explicit `.env.prod` connection. It exports the open configuration to `/tmp/powis-production-configuration.json`, recursively checks incoming foreign keys, and refuses any non-configuration dependencies. `--apply` performs only the specific draft deletion transaction. Rerunning after deletion reports it already absent.

## Local reconciliation

`node --experimental-strip-types scripts/reconcile-local-powis-rooms.ts` dry-runs against the localhost database from `.env`, using the production configuration export above. `--apply` aligns the existing local review room options/rates and deposit rule, and deactivates duplicate venue groups. It refuses missing or mismatched physical rooms. Booking IDs, room IDs, historical prices, registration details, page content and testimonials are preserved. No event-time changes are made.

Applied locally: retained four `local-powis-review-*` groups and deactivated four `demo-powis-*` groups. The two older generic groups were already inactive. Existing demo/test bookings remain intact. Backup: `/tmp/local-powis-before-reconcile-1791203283046.json`.

Review at `/retreats/local-powis-room-review`. The older demo event remains historical test data; use the review event for the production-matched setup.

## Application rollout

Deploy the room selector and physical inventory checks together after validation. Keep existing production option/rate IDs and shared inventory pools; do not regenerate room setup. Production's open event already has the correct rates: shared £450/£425; private solo £550/£525; private two-person totals £900/£850 for private/shared bathrooms respectively.

The prior onboarding review remains informational; no registration gaps were changed as part of this work.
