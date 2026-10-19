# Copy Change Register

18 October 2026. Checkpoint 2 reviewed by the owner. A-01 and A-02 are APPROVED AS IMPLEMENTED. A-03 and A-04 are APPROVED FOR IMPLEMENTATION AND PUBLICATION as part of the authorised analytics release; no further editorial approval is needed for their exact wording. Consent UI is implemented. Policy additions are gated by the release effective date and have not been published to production.

This initial register covers the Stage A consent dependency. The Stage B page-by-page register appears below following Stage A closure. Existing staged design work predates this brief; it is not automatically approved editorial copy and must be reconciled against the approved baseline before release.

## A-01 — Analytics consent invitation

- Page/section: eligible public pages, new cookie preference invitation.
- Exact existing text: **new section**.
- Exact proposed wording:
  - Heading: “Analytics preferences”
  - Body: “May we use Google Analytics to understand how visitors use this website? It helps us measure visits, enquiries and bookings. Analytics is optional and stays off unless you accept. You can change your choice at any time.”
  - Buttons: “Accept analytics”; “Reject analytics”
  - Policy link: “Cookie policy”
- Reason: a genuine affirmative analytics choice is required; current forms only collect unrelated consent. Both choices will have equal accessibility and comparable prominence.
- Approval: **APPROVED AS IMPLEMENTED by owner at Checkpoint 2**.
- Implementation: approved interface implemented; production activation remains gated.

## A-02 — Persistent preference management

- Page/section: shared footer preference control and preference dialog.
- Exact existing text: **new section** (existing “Cookies” link remains unchanged).
- Exact proposed wording:
  - Footer control and dialog heading: “Analytics preferences”
  - Toggle: “Allow Google Analytics”
  - Description: “Analytics helps us understand how visitors use the website and measure enquiries and bookings. You can switch it on or off here. Turning it off stops future analytics collection but doesn't delete information already collected. We don't use Google Analytics for personalised advertising.”
  - Buttons: “Save preferences”; “Cancel”
- Reason: repeat visitors need a clear way to grant or withdraw consent without repeating the initial invitation.
- Approval: **APPROVED AS IMPLEMENTED by owner at Checkpoint 2**.
- Implementation: approved wording implemented; policy publication remains subject to the release checklist.

## A-03 — Cookie-policy addition

- Page/section: `/cookies`, additional subsection under analytics/marketing; existing paragraphs preserved.
- Exact existing text: **new section**.
- Exact proposed wording:
  - Heading: “Google Analytics preferences”
  - Body: “With your permission, we use Google Analytics to understand how people use our public website pages and measure actions such as enquiries, newsletter subscriptions and bookings.

    Google Analytics uses cookies and similar technologies. It remains off unless you accept analytics, and we don't use it for personalised advertising.

    You can change or withdraw your choice at any time using Analytics preferences in the website footer. Withdrawing consent stops future analytics collection but doesn't delete information already collected.”

- Reason: explain the actual proposed controls and measurement purposes; the existing policy is generic. The owner has approved this exact wording; publish with analytics activation after explicit release approval.
- Approval: **APPROVED FOR IMPLEMENTATION AND PUBLICATION by owner at Checkpoint 2; no further editorial approval required**.
- Implementation: approved wording implemented; policy publication remains subject to the release checklist.

## A-04 — Privacy-policy addition

- Page/section: `/privacy`, additional analytics subsection; existing paragraphs preserved.
- Exact existing text: **new section**.
- Exact proposed wording:
  - Heading: “Optional website analytics”
  - Body: “With your permission, we use Google Analytics to understand visits to public website pages and measure actions such as successful coaching enquiries, confirmed newsletter subscriptions and bookings.

    Google Analytics may receive cookie identifiers, browser and device information, the type of action taken and, for purchases, the amount paid. We do not include names, contact details, health information, free-text form responses or payment card details in our analytics events.

    You can change or withdraw your analytics consent through Analytics preferences in the website footer. Withdrawing consent stops future analytics collection but doesn't erase information previously collected.”

- Reason: distinguish analytics consent from service, health and email-marketing consent. Provider processing, retention and transfer disclosures require owner review; this paragraph is not a replacement for those disclosures or a legal compliance assurance.
- Approval: **APPROVED FOR IMPLEMENTATION AND PUBLICATION by owner at Checkpoint 2; no further editorial approval required**.
- Implementation: approved wording implemented; policy publication remains subject to the release checklist.

## Technical changes requiring no copy approval

Production/route gating, removing unconditional Google loading, typed payload allowlists, safe manual page views, event hooks, verified conversion receipts, testing and internal documentation can be implemented without changing approved visible words. The owner has approved Stage A and its consent wording. Production activation remains dependent on final account/policy checks and explicit deployment approval. Checkpoint 2 approval authorises these refinements, not deployment.

## Stage B approval scope

B-01–B-07 are explicitly approved below. No additional marketing or metadata wording has been introduced.

## Outstanding factual/policy decisions

Confirm the release effective date, GA property data-retention settings, Google contractual/transfer arrangements and production cookie behaviour against the approved A-06 wording. Those facts have not been invented or published. B-01–B-07 have now been separately approved below.

## A-05 — Analytics storage and durations

- Page/section: `/cookies`, immediately after approved A-03.
- Exact existing text: **new section**.
- Approval: **APPROVED WITH AMENDMENTS — implementation authorised, subject to factual verification before production publication.**
- Implementation: exact approved wording is implemented behind the existing publication-date gate. Existing policy text is preserved. Deduplication now has a fixed 180-day lifetime and withdrawal cleanup.
- Factual verification: A-06 now approves wording that distinguishes fixed `_ga` expiry from the stream cookie’s refreshed expiry. Nothing has been published. See [A-05 verification](analytics-a05-verification.md) and the Stage B handover for combined verification.
- Exact approved wording:

### Analytics storage and durations

We use a cookie and browser storage to remember your analytics choice for up to 180 days, whether you accept or reject analytics. Other optional analytics storage is used only after you accept.

| Storage                                                        | Purpose                                                                                                                           | Duration                                                                                                                            |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `st_analytics` cookie and `st-analytics-v1` browser storage    | Remember whether you accept or reject analytics.                                                                                  | Your choice is valid for 180 days.                                                                                                  |
| Google Analytics cookies, including `_ga` and `_ga_PT4XP6G7CF` | Help Google Analytics distinguish browsers and measure website visits.                                                            | The `_ga` cookie expires up to 180 days after creation. The `_ga_PT4XP6G7CF` cookie expires up to 180 days after its latest update. |
| `st_analytics_receipt` cookie                                  | Confirm that a newsletter subscription was verified and whether guide delivery was initiated, for optional analytics measurement. | Up to 10 minutes; removed when used.                                                                                                |
| `st-analytics-attribution-v1` browser session storage          | Remember recognised marketing campaign information or referring website domains during your visit.                                | Up to 30 minutes from the latest page navigation, within the browser tab session.                                                   |
| `st-analytics-plan` browser session storage                    | Remember the coaching plan category you selected.                                                                                 | Up to 30 minutes, within the browser tab session.                                                                                   |
| `st-ga-sent` browser storage entries                           | Help prevent the same conversion being counted repeatedly.                                                                        | Up to 180 days from the recorded event, or sooner if analytics consent is withdrawn or browser storage is cleared.                  |

Browser settings may remove this information sooner. These durations describe storage in your browser, not how long Google retains analytics data.

You can change your analytics choice at any time. Withdrawing consent stops future analytics collection but does not erase information already collected.

## A-06 — Google-cookie duration wording

- Page/section: `/cookies`, A-05 table, Google Analytics cookies row, Duration cell.
- Exact currently approved text: “Up to 180 days from creation, without automatically extending that expiry on each visit.”
- Exact proposed replacement: “The `_ga` cookie expires up to 180 days after creation. The `_ga_PT4XP6G7CF` cookie expires up to 180 days after its latest update.”
- Reason: reflects the real-tag cookie behaviour observed in the isolated desktop/mobile test. This is an alternative to changing the implementation to enforce a non-refreshing expiry for both cookies.
- Approval: **APPROVED EXACTLY AS PROPOSED** at Stage A closure. Implemented with Stage B; Google cookie configuration retained. Verification included in combined release checklist.

# Stage B — owner review register (19 October 2026)

The owner explicitly approved B-01–B-07 in the resume-and-complete instruction. All seven are now implemented; B-04 and B-06 use the exact revised wording below. Other customer-facing copy remains protected. Existing About CTA is already inclusive (“Ready to find support that fits?”); no replacement is proposed. Existing retreat card titles, summaries, pricing labels and benefits are retained in full; no shortened alternatives are needed.

## B-01 — Homepage service pathways

- Page/section: `/`, replace the standalone retreat promotion with two complementary cards.
- Exact existing heading: “Retreats and workshops for movement, rest and recovery.”
- Exact existing body: “Small retreat experiences for people who want flexible movement options, thoughtful pacing and space to recover without pressure to perform.”
- Exact existing CTA: “Explore retreats and workshops”.
- Exact proposed heading: “Ways to Work With Me”.
- Exact proposed card 1: “Personal Coaching”; “Individual support to build strength, confidence and capability through adaptable training.”; CTA “Explore Coaching” → `/coaching`.
- Exact proposed card 2: “Retreats & Workshops”; “Shared experiences that create space for movement, learning, wellbeing and rest.”; CTA “Explore Experiences” → `/retreats`.
- Reason: give first-time visitors two clear service routes without adding another large section.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## B-02 — About transition

- Page/section: `/about`, after the three perspectives; **new section**.
- Exact proposed wording: “These perspectives shape how I coach and teach: understanding your starting point, building what you can do and making movement work in everyday life.”
- Exact proposed links: “Explore Coaching” → `/coaching`; “Retreats & Workshops” → `/retreats`.
- Reason: connect the existing professional and personal context to available support without repeating plans.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## B-03 — Upcoming experience shortcut

- Page/section: `/retreats`, **new section** near the top.
- Exact proposed label: “Next Up”.
- Exact proposed CTA: “View Event”.
- Existing event title, date, location, image and price would come unchanged from the next eligible published, available dated event; no new summary proposed.
- Reason: help visitors find the nearest available experience while preserving retreat/workshop categories.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## B-04 — Coaching trust section

- Page/section: `/coaching`, after benefits; **new section**.
- Exact proposed heading: “Why Work With Shruti?”
- Exact proposed paragraph: “My PhD in Rehabilitation sits alongside my experience in personal training, strength and conditioning, and yoga. I bring these perspectives together to understand what matters to you and build movement and training that fits your body, goals and everyday life.”
- Exact proposed CTA: “Meet Shruti” → `/about`.
- Reason: explain the relevant background concisely, with an authentic existing photograph.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## B-05 — Retreat host introduction

- Page/section: individual experience page, host card.
- Exact existing text: “Your host”; “Shruti Turner”; “Meet Shruti and explore her approach”.
- Exact proposed addition (retain all existing text): “Shruti brings together rehabilitation knowledge, strength coaching and yoga teaching to offer movement that can adapt to different bodies, experience and energy levels.”
- Reason: give visitors useful context about their host without making unverified claims about event delivery.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## B-06 — Newsletter invitation

- Page/section: `/subscribe` and shared newsletter invitation constants.
- Exact existing heading: “Been told to be careful with exercise because of pain, injury or illness?”
- Exact existing body: “Learn how to train intelligently, rebuild confidence and build strength in a way that works with your body.”
- Exact existing CTA: “Get the free guide”.
- Exact proposed heading: “Movement, strength and wellbeing for real life.”
- Exact proposed body: “Practical ideas on movement, strength and wellbeing, alongside new articles, workshops and retreat updates. Join my newsletter and you'll also receive my free guide, Rebuild Your Strength, which explores training with pain, injury or chronic illness.”
- Exact approved CTA: “Join the Newsletter”. Guide-specific descriptions, guide title, delivery and subscription consent remain unchanged.
- Reason: distinguish the broader newsletter invitation from the specific guide audience.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## B-07 — Coaching SEO title

- Page/section: `/coaching`, metadata title.
- Exact existing text: “Online Personal Training & Coaching | Shruti Turner”.
- Exact proposed wording: “Online Personal Training & Movement Coaching | Shruti Turner”.
- Reason: align the search title with the existing movement coaching service.
- Approval: **APPROVED — IMPLEMENTED** under the resume-and-complete instruction.

## No-copy implementation scope

- Reorder existing coaching demonstration after plans; repair accidental triple rendering of the same testimonials (retain one complete instance).
- Move accommodation and travel below daily rhythm, keeping all content and booking logic.
- Expose the existing main explanation within the homepage diagram section without requiring interaction, with the exact existing words.
- Improve mobile image/video proportions, story reading width, event image sizing and navigation wrapping without truncating content.
- Match route loading skeletons to the current coaching, listing, detail and checkout layouts.
- Keep already successful two-column event cards, approved feedback, FAQ content, newsletter functionality and staged enquiry/contact designs.
