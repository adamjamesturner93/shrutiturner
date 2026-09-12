# Admin operating model

The admin is organised around the next decision or task. Read-only pages do not perform hidden external
writes, destructive actions require explicit confirmation, and detailed setup stays behind the relevant
section rather than competing with daily operations.

## Members

The list uses one server-owned risk classification and one filter surface. Open a member to see their
membership, credits, health context, communication preferences and activity. Use the section links on a
long record. Access/role changes and privacy actions remain separate from normal member follow-up.

## Coaching

The pipeline tabs are the workload summary: new enquiries, consultations, waiting list, awaiting payment,
active/onboarding clients and closed records. Counts in the tabs replace duplicate metric cards. Search
within the current stage and filter by support level. Compact records link to
`/admin/coaching/[applicationId]`; historical `?application=` links resolve to the same detail route.
The detail begins with the next operational step. Historical enquiry answers are collapsed.

Website coaching status, Stripe billing and Everfit access are deliberately separate states. Closing one
does not imply that the other two have been completed; the next-step message and task badges expose the
remaining work.

## Newsletter

Contentful publication creates a single database campaign per issue and freezes its content and audience.
The campaign detail is the recovery surface:

- Failed queued messages can be retried without rebuilding the audience.
- Unsubscribed recipients are suppressed at retry time.
- A provider request with an unknown outcome is labelled **reconciliation required**, never **sent**.
- Staff must inspect Postmark, select the reviewed recipients and record supporting evidence before
  confirming their outcomes in a dialog. Marking them not sent does not automatically retry; retry
  remains a separate action to reduce duplicate-send risk. Provider acceptance is not inbox delivery.
- An active processing lease blocks concurrent retry/reconciliation. Expired ambiguous attempts still
  require evidence, never an automatic assumption that the messages were not sent.
- Interrupted preparation resumes the saved recipient manifest. Older incomplete campaigns without
  a manifest require review instead of rebuilding their audience.

## Business

The overview reads local projections only. It never calls Stripe merely because somebody opens the page.
When projections are missing or older than 15 minutes, **Sync from Stripe** performs the external read and
records an admin action. Pricing, discounts, class rules, site settings and billing operations are separate
tabs and load their supporting data only when opened.

Business sections, newsletter workspaces and retreat-list lifecycle selections are retained in the URL.
These saved values are allowlisted navigation choices, not recipient names or private search terms.

## Implementation status

These changes are in the working tree, not a deployment assertion. See
[the implementation progress record](admin-ux-remediation-progress.md) for verification and outstanding
items, including the payment-selection/refund workflow and remaining permission/recovery coverage.
