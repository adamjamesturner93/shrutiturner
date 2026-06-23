export type LegalDocumentSlug =
  | "terms"
  | "privacy"
  | "cookies"
  | "health-declaration"
  | "refund-policy"
  | "acceptable-use"
  | "coaching-agreement";

export type LegalDocumentSeed = {
  id: string;
  slug: LegalDocumentSlug;
  title: string;
  version: string;
  effectiveDate: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
};

const EFFECTIVE_DATE = "2026-03-12";
const VERSION = "2026-03-12";

export const HEALTH_DATA_CONSENT = {
  version: VERSION,
  title: "Health Data Consent",
  description:
    "I explicitly consent to Shruti Turner processing the health information I provide so my services can be delivered safely and appropriately.",
} as const;

export const LEGAL_DOCUMENTS: LegalDocumentSeed[] = [
  {
    id: "legal-terms",
    slug: "terms",
    title: "Terms & Conditions",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Terms & Conditions - Shruti Turner",
    seoDescription:
      "Terms and conditions covering memberships, classes, coaching, retreats, payments, bookings and service use.",
    body: `1. About these terms

These Terms & Conditions govern your use of the Shruti Turner website, your account and any services you buy, book or access through the platform. This includes Move Well Classes, memberships, credit packs, small group programmes, retreats, digital content and 1:1 services.

By creating an account, booking a service or using the website, you agree to these terms.

2. Who we are

Shruti Turner provides rehabilitation-informed strength and yoga services for adults including people living with chronic illness, pain, fatigue, autoimmune conditions and hypermobility.

For general enquiries, email tech@thechronicyogini.com.

3. Eligibility

You must be 18 or over to create an account or buy services through this website.

You must provide accurate information when you create an account, complete health forms, book services or make payments.

You are responsible for keeping your login details secure and for activity that happens through your account.

4. Service overview

Services available through the platform may include:
- Move Well Membership
- class credit packs
- live online classes
- small group programmes
- one-to-one coaching and training support
- retreats, workshops and other events
- educational and digital resources

Specific service details, inclusions and prices are shown on the relevant page at the time of purchase or booking.

5. Health and safety

Our services are educational movement, training and support services. They are not medical diagnosis, treatment, emergency care or a substitute for advice from your GP, consultant, physiotherapist or other healthcare professional.

You are responsible for:
- deciding whether participation is appropriate for you
- seeking medical advice where needed
- providing accurate health information
- stopping any activity that feels unsafe
- telling us if your symptoms, diagnosis, medication or capacity changes

We may refuse, limit, pause or end participation where we reasonably believe a service is unsafe or unsuitable without further medical input.

6. Health & Liability Waiver

Participation in services is subject to the Health & Liability Waiver published at /health-declaration.

Where a service requires additional health or screening information, you agree to complete that information honestly and promptly.

7. Accounts, access and platform use

You may not impersonate another person, share access to paid services inappropriately or attempt to interfere with the security or operation of the platform.

We may suspend or restrict access where we reasonably suspect misuse, fraud, abuse or behaviour that creates risk for other clients, instructors or the business.

8. Memberships

Move Well Membership terms, pricing, billing interval and included benefits are shown on the pricing and membership pages.

Memberships renew automatically unless cancelled in accordance with the published cancellation rules.

Before a membership checkout is completed, we provide subscription-specific pre-contract information covering price, renewal timing, reminder notices, cancellation method and cooling-off rights.

If you enter a membership online, you can also cancel it online from your membership dashboard.

We send separate reminder and end-of-contract notices for memberships, including reminders before the free trial ends, before annual renewals and periodic reminders for rolling monthly memberships.

Memberships include statutory cooling-off rights where required by consumer law, including an initial cooling-off period after signup and further renewal cooling-off rights after trial conversion and annual renewals.

Membership benefits are personal to the named account holder and cannot be transferred unless we expressly agree otherwise.

9. Credit packs

Credit packs give access to the number of classes shown at purchase.

Credits:
- are personal to the named account holder
- expire in line with the expiry window shown at purchase
- do not auto-renew
- cannot be exchanged for cash

Where a class is cancelled by us, the relevant credit will be restored or an appropriate alternative will be provided.

10. Class booking, attendance and late entry

Class bookings are subject to availability and any booking window shown in the product.

Late cancellation, no-show, waitlist and attendance handling are governed by the booking rules published in the product at the time of booking.

Live classes may include a late-join cutoff. If a participant has not joined within the permitted window, entry may be refused for safety and class-quality reasons.

We may record attendance, room joins, room leaves, moderator actions and related operational events to manage classes, no-shows and service delivery.

11. Live room conduct

During live classes, events and coaching calls, you must behave respectfully toward instructors and other participants.

You must not:
- harass, intimidate or disrupt others
- record or redistribute sessions without permission
- misuse chat, video, audio or moderation features
- attempt to gain access to rooms or controls you are not entitled to use

We may mute, remove, suspend or restrict participants where conduct is unsafe or disruptive.

12. Coaching services

Coaching services may include programming, check-ins, calls, reviews, messaging, Everfit access and related support, depending on the tier purchased or agreed.

Response times, review cadence and inclusions vary by tier. The specific package or agreement you purchase governs what is included.

1:1 services are not unlimited medical support, crisis support or emergency communication channels.

13. Retreats, workshops and events

Retreats and in-person or hybrid events may require additional forms, screening, waiver acceptance or travel information.

You are responsible for arranging your own travel, insurance and any personal requirements unless the event page expressly states otherwise.

Travel insurance with appropriate medical and cancellation cover is strongly recommended and may be mandatory for some retreats.

14. Payments

Payments are processed securely by Stripe or another named payment provider. We do not store full payment card details.

You must pay all charges due at the point required by the relevant service.

If payment fails, we may suspend access, cancel a booking or prevent further bookings until payment is resolved.

15. Refunds and cancellations

Refund and cancellation terms vary by service. The Refund & Cancellation Policy published at /refund-policy forms part of these terms.

Where a more specific service page sets out additional cancellation terms, those service-specific terms also apply.

16. Intellectual property

All website content, class materials, programme materials, videos, recordings, copy, branding and educational resources remain the intellectual property of Shruti Turner unless stated otherwise.

You receive a personal, non-transferable licence to use purchased materials for your own personal use only.

You must not copy, resell, distribute, upload or commercially exploit these materials without written permission.

17. Acceptable use

Your use of the website and services is also subject to the Acceptable Use Policy at /acceptable-use.

18. Liability

Nothing in these terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law.

Subject to that, we are not liable for indirect or consequential loss, loss of profit, loss of opportunity or losses arising from circumstances outside our reasonable control.

Our total liability in relation to any claim connected with paid services will, to the fullest extent permitted by law, be limited to the amount paid by you for the relevant service giving rise to the claim.

19. Changes to services or terms

We may update services, schedules, pricing, policies and these terms from time to time.

Where changes materially affect ongoing services or legal rights, we will take reasonable steps to notify account holders. Continued use of the platform after the updated terms take effect constitutes acceptance of the updated version.

20. Governing law and contact

These terms are governed by the laws of England and Wales.

Any dispute arising in connection with these terms or the services will be subject to the courts of England and Wales, unless mandatory consumer law requires otherwise.

For questions about these terms, contact tech@thechronicyogini.com.`,
  },
  {
    id: "legal-privacy",
    slug: "privacy",
    title: "Privacy Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Privacy Policy - Shruti Turner",
    seoDescription:
      "How Shruti Turner collects, uses, stores and protects personal data, including health information.",
    body: `1. Who we are

Shruti Turner is the controller of the personal data described in this Privacy Policy.

If you have questions about privacy or want to exercise your data rights, email privacy@shrutiturner.com.

2. Scope of this policy

This policy explains how we collect, use, store, share and protect personal data when you:
- visit the website
- create an account
- subscribe to emails
- book classes, memberships, credits, programmes, retreats or 1:1 services
- complete health, 1:1, retreat or support forms
- contact us directly

3. Personal data we collect

Depending on how you use the website or services, we may collect:
- name, email address, phone numberand account details
- date of birth, timezone and account preferences
- booking, attendance, membership, credit-pack and billing history
- referral and promotion activity
- contact and support messages
- newsletter and marketing preferences
- 1:1, retreat or application form responses
- device, browser, IP and security information
- cookie, localStorage and sessionStorage related information described in the Cookie Policy

4. Special category and health data

Some services require health-related information so we can deliver them safely and appropriately. This may include information about diagnoses, symptoms, pain, fatigue, hypermobility, injuries, flare patterns, medications, limitations, emergency details and related contextual notes.

We treat this as special category personal data.

We process health data because:
- you explicitly provide it to access health-sensitive services
- it is necessary to tailor services safely
- it is necessary to protect your vital interests in emergency situations where relevant

5. How we collect data

We collect data:
- directly from you through account creation, forms, bookings, check-ins, waivers and contact submissions
- automatically through site usage, authentication, security and service-delivery events
- from payment, authentication, email and video vendors where needed to operate the service

6. Why we use personal data

We use personal data to:
- create and manage accounts
- deliver memberships, bookings, credits, classes, coaching, retreats and related support
- personalise programming and class adaptations
- manage attendance, room access, waitlists and no-shows
- process payments, invoices, refunds and account actions
- send transactional emails and service updates
- respond to enquiries and support requests
- operate referrals and promotions
- improve the service, prevent misuse and keep the platform secure
- comply with legal, accounting, tax and consumer-protection obligations

7. Lawful bases

We rely on one or more of the following lawful bases:
- contract, where processing is necessary to provide the service you requested
- legitimate interests, where processing is necessary to run, improve and protect the business and platform
- consent, for optional marketing communications and certain health-sensitive data uses
- legal obligation, where records must be kept or disclosed by law

For special category health data, we rely on explicit consent and, where relevant, the conditions that allow processing for health, safety and service delivery in line with applicable law.

8. Payments, video, email and other providers

We use third-party processors and service providers to operate the business. These may include:
- Stripe for payments and checkout
- Postmark for transactional email delivery
- Google where sign-in or related account services are used
- Daily for live class and live-room service delivery
- Contentful for website and content management
- Cloudflare Turnstile for spam prevention and security checks
- hosting, infrastructure, analytics and support vendors needed to run the site

These providers process data only to the extent needed for their service and under their own contractual and security obligations.

9. Attendance, live rooms and operational records

When you book or join live services, we may record operational information such as booking status, room joins, room leaves, attendance events, moderation actions and connected service metadata.

This helps us deliver live services, manage attendance, resolve support issues and operate the platform safely.

10. International transfers

Some service providers may process personal data outside the UK.

Where this happens, we take reasonable steps to ensure appropriate safeguards are in place, such as approved contractual protections or equivalent transfer mechanisms.

11. Retention

We keep personal data only for as long as necessary for the purposes described in this policy, including to comply with legal, tax, accounting, safety and dispute-resolution obligations.

Retention periods vary by data type. For example:
- account and transactional records may be kept for several years to meet tax and accounting obligations
- if you request account deletion, the account is first soft-deleted so access stops immediately while certain health declarations and legal acceptance records are retained for up to 6 months for safety, dispute handling and legal protection
- legal hold may extend that retention where there is an active dispute, complaint or claim
- marketing preferences are kept until you unsubscribe or ask us to stop
- security and operational logs are retained for a limited period appropriate to fraud prevention and service reliability

12. Your rights

Subject to applicable law, you may have the right to:
- access a copy of your personal data
- correct inaccurate or incomplete data
- request deletion of data in some circumstances
- restrict or object to some processing
- withdraw consent where processing depends on consent
- receive a portable copy of certain data
- complain to the Information Commissioner's Office

To exercise these rights, contact privacy@shrutiturner.com.

13. Security

We use reasonable technical and organisational measures to protect personal data, including access controls, authentication, secure vendor tooling and environment-based security measures.

No system is completely secure, so we cannot guarantee absolute security.

14. Changes to this policy

We may update this Privacy Policy from time to time.

The latest version is always published on this page with its effective date and version number. Where changes materially affect how your data is handled, we may also notify users through the platform or by email.`,
  },
  {
    id: "legal-cookies",
    slug: "cookies",
    title: "Cookie Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Cookie Policy - Shruti Turner",
    seoDescription:
      "How cookies, local storage, session storage and related technologies are used across the site.",
    body: `1. What this policy covers

This Cookie Policy explains how we use cookies and similar technologies on the website.

For this site, "cookies and similar technologies" includes:
- browser cookies
- localStorage
- sessionStorage
- related security and anti-abuse technologies that support core site functionality

2. Why we use these technologies

We use strictly necessary and functional technologies to:
- keep the site secure
- maintain sign-in and session state
- support checkout, booking and account flows
- remember interface preferences
- remember newsletter popup or consent states
- remember device preferences for live classes where relevant

3. Strictly necessary technologies

Strictly necessary technologies are used to operate the website and services you request. These technologies do not require optional marketing-style consent because the site would not work properly without them.

Examples used by this platform may include:
- authentication and session cookies used by the sign-in system
- CSRF, security or verification related cookies
- payment and checkout continuity cookies where required by the payment provider
- anti-spam or challenge state set by Cloudflare Turnstile

4. Functional storage and remembered preferences

We also use functional browser storage for product experience features such as:
- sidebar state and UI preferences
- newsletter popup suppression
- saved media-device preferences for live classes

These technologies help the site remember settings you have already chosen.

5. Third-party technologies used on the site

The site may involve third-party technologies from providers such as:
- Stripe, for checkout and payment processing
- Google, where account sign-in or related services are used
- Daily, for live class and live-room functionality
- Cloudflare Turnstile, for bot and spam prevention

These services may set their own cookies or related browser state when their tools are used.

6. Technology schedule

The technologies currently expected on this site fall into the following groups:

Strictly necessary
- authentication/session cookies used by the account system
- security and anti-forgery cookies
- checkout continuity cookies used by payment providers
- challenge/security state related to Turnstile

Functional
- sidebar state cookie
- newsletter popup state in sessionStorage
- media-device preferences in localStorage

If additional analytics or advertising technologies are added in future, this policy will be updated before or when they go live.

7. Your choices

You can manage cookies through your browser settings and clear local or session storage from your browser at any time.

Be aware that disabling necessary cookies or clearing key storage may affect sign-in, checkout, booking, live-room or other site functionality.

If we introduce optional analytics or marketing technologies in future, we will provide the relevant controls and update this policy accordingly.`,
  },
  {
    id: "legal-health-waiver",
    slug: "health-declaration",
    title: "Health & Liability Waiver",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Health & Liability Waiver - Shruti Turner",
    seoDescription:
      "Health and liability waiver for classes, coaching, retreats and other physical services.",
    body: `1. Understanding the service

I understand that Shruti Turner's services may include strength training, yoga, movement coaching, classes, programmes, retreats and related physical activity.

I understand that these services are educational movement, training and support services. They are not medical diagnosis, treatment, rehabilitation or emergency care.

2. My responsibilities

I confirm that I am responsible for:
- deciding whether participation is appropriate for me
- seeking medical advice where needed
- disclosing relevant health information honestly
- stopping or modifying activity if I feel unsafe
- informing my coach or instructor about changes in symptoms, diagnosis, medication or capacity

I understand that my body may fluctuate and that choosing rest, adaptation or a lower-intensity option is valid.

3. Assumption of risk

I understand that physical activity carries inherent risks, including pain, fatigue, symptom flare, dizziness, aggravation of existing conditions, falls, strains, sprains and other injury or health complications.

I voluntarily choose to participate and accept responsibility for the risks that are reasonably inherent in taking part.

4. Limitation of liability

To the fullest extent permitted by law, I agree that Shruti Turner and anyone acting on her behalf will not be liable for loss, injury, illness or damage arising from my participation except where liability cannot lawfully be excluded, including liability for death or personal injury caused by negligence.

5. Consent and acknowledgement

By accepting this waiver, I confirm that I have read and understood it, that I have had the opportunity to seek medical advice if needed and that I choose to participate on this basis.

I also understand that additional health questions or screening may be required for specific services such as retreats, 1:1 support or other health-sensitive offers.`,
  },
  {
    id: "legal-refund-policy",
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Refund & Cancellation Policy - Shruti Turner",
    seoDescription:
      "Refund and cancellation terms for memberships, credits, classes, programmes, coaching and retreats.",
    body: `1. General approach

We aim to be clear and fair about cancellations, refunds, pauses and credits.

Different services operate differently, so the specific product page and booking flow should always be checked at the time of purchase. This policy explains the general rules that apply across the platform.

2. Memberships

Memberships renew automatically until cancelled.

You can cancel a membership online from your membership dashboard.

If you cancel outside a statutory cooling-off period, your access usually continues until the end of the paid billing period unless stated otherwise in the product flow.

If you cancel during an applicable statutory cooling-off period, we will process any refund required by consumer law. Where the law allows for a pro-rata deduction for services already supplied during a renewal cooling-off period, that deduction may be applied.

We also send written cancellation acknowledgements and end-of-contract notices for memberships on a durable medium.

3. Credit packs and class bookings

Credit packs do not auto-renew and cannot usually be refunded once purchased unless required by law.

Where a class booking is cancelled within the permitted cancellation window, the credit used for that booking will normally be returned to your account.

If you miss a class, join too late to attend or cancel outside the permitted cancellation window, the credit or entitlement may be treated as used.

4. Small group programmes and coaching services

Because programmes and coaching reserve capacity, planning time, review time and support availability, refunds are not usually available once a programme or coaching period has started.

Where appropriate, we may at our discretion offer:
- a pause
- a reschedule
- a future-credit style arrangement

This is not guaranteed and will depend on the service, timing and circumstances.

5. Retreats and events

Retreat or event cancellation terms are shown on the relevant retreat or event page and may vary by venue or supplier commitments.

For in-person retreats, the deposit amount is non-refundable. If you pay in full and later cancel, the amount that would have been the deposit is still treated as non-refundable.

Unless the retreat page states otherwise, in-person retreat payments above the deposit are refundable if you cancel more than 8 weeks before the retreat starts. Within 8 weeks of the start date, retreat payments are not normally refundable because venue, accommodation and supplier costs have been committed.

For online retreats, the non-refundable amount is the greater of £10 or 10% of the retreat price. Payments above that amount are normally refundable until 14 days before the online retreat starts, unless the retreat page states a different window.

6. Medical issues and chronic illness fluctuations

We recognise that chronic illness and pain can be unpredictable.

If you need to cancel or pause because of illness, flare or another genuine health issue, please contact us as early as possible. Where we reasonably can, we will try to find a fair solution. However, this does not create an automatic right to a refund outside the published terms.

7. Consumer rights and contact

Nothing in this policy limits any legal rights you may have under applicable consumer law.

If you have a cancellation or refund question, contact tech@thechronicyogini.com as soon as possible and include the relevant service, booking or order details.`,
  },
  {
    id: "legal-acceptable-use",
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Acceptable Use Policy - Shruti Turner",
    seoDescription:
      "Rules for using the website, classes, live rooms and community spaces safely and respectfully.",
    body: `1. Purpose

This Acceptable Use Policy explains the standards expected when using the website, your account, live rooms, bookings, classes and related services.

2. Respectful behaviour

You must treat instructors, staff, contractors and other users respectfully.

You must not engage in harassment, bullying, discrimination, abuse, intimidation or threatening behaviour.

3. Honest and safe participation

You must provide accurate information when creating an account, completing forms, booking services or disclosing health information.

You must not knowingly misrepresent your identity, eligibility, payment information or health-related information relevant to safe participation.

4. Platform and account misuse

You must not:
- try to access data, rooms or systems you are not authorised to access
- interfere with the website, payment flows, booking flows or live-room systems
- share access in a way that circumvents pricing or account rules
- upload or transmit malware, spam or abusive content
- scrape, copy or automate access to the site in a way that harms the service

5. Live classes and coaching spaces

When using live rooms, chat, audio or video features, you must not:
- disrupt the class or coaching session
- record or redistribute sessions without permission
- use offensive, abusive, sexually explicit or unlawful content
- misuse moderator or community features

6. Consequences

If we reasonably believe this policy has been breached, we may remove content, cancel bookings, suspend access, restrict live-room access, close accounts or take any other proportionate steps needed to protect people and the platform.

7. Reporting concerns

If you experience or witness misuse of the service, contact tech@thechronicyogini.com so it can be reviewed.`,
  },
  {
    id: "legal-coaching-agreement",
    slug: "coaching-agreement",
    title: "1:1 Agreement",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "1:1 Agreement - Shruti Turner",
    seoDescription:
      "The coaching-specific agreement covering scope, communication, check-ins, Everfit and client responsibilities.",
    body: `1. Purpose of this agreement

This 1:1 Agreement explains the basis on which 1:1 services are discussed, offered and delivered by Shruti Turner.

It applies to coaching applications and, where you become a client, forms part of the expectations around the working relationship.

2. Nature of coaching support

Coaching may include programming, written review, check-ins, calls, messaging, Everfit delivery, education and accountability support depending on the tier agreed.

1:1 support is collaborative. It is not crisis support, psychotherapy, emergency medical support or a guarantee of specific results.

3. Client responsibilities

As a coaching client or applicant, you agree to:
- provide honest information about your goals, history, symptoms and capacity
- complete check-ins and requested forms as accurately as possible
- communicate when something is not working or your circumstances change
- use the support channel and cadence appropriate to your tier
- make your own decisions about participation and seek medical advice where needed

4. Check-ins and reviews

Coaching relies on regular check-ins. Depending on your tier, these may be weekly or monthly.

If you do not complete check-ins or provide the information needed for review, programming updates and coaching guidance may be limited, delayed or less precise.

5. Everfit and connected tools

Where Everfit is used, it acts as the training-delivery layer for workouts, habits and check-ins. The website remains the main service and account hub.

You are responsible for engaging with the relevant tools and notifications needed to receive the service properly.

6. Communication boundaries

Response times vary by tier and are not 24/7.

Coaching communication is for service delivery only and must not be used for emergencies. If you need urgent medical help, contact an appropriate healthcare or emergency service.

7. 1:1 service changes

1:1 services are billed separately from any current or future class membership, credit, workshop or retreat offer.

If your 1:1 service changes, your billing and service entitlement may also change. Shruti will confirm the timing and any payment impact before the change is applied.

8. No guarantee of outcomes

Bodies are variable, especially in the context of chronic illness, pain and fatigue.

1:1 support aims to support safer, more confident and more consistent training, but no specific physical, medical or performance outcome is guaranteed.

9. Agreement acknowledgement

By ticking the 1:1 Agreement box during the application flow, you confirm that you have read this agreement and understand how 1:1 support is structured before you proceed with an application or enquiry.`,
  },
];

export const LEGAL_DOCUMENTS_BY_SLUG = Object.fromEntries(
  LEGAL_DOCUMENTS.map((document) => [document.slug, document])
) as Record<LegalDocumentSlug, LegalDocumentSeed>;

export const CURRENT_TERMS_VERSION = LEGAL_DOCUMENTS_BY_SLUG.terms.version;
export const CURRENT_HEALTH_WAIVER_VERSION = LEGAL_DOCUMENTS_BY_SLUG["health-declaration"].version;
export const CURRENT_HEALTH_DATA_CONSENT_VERSION = HEALTH_DATA_CONSENT.version;
export const CURRENT_COACHING_AGREEMENT_VERSION =
  LEGAL_DOCUMENTS_BY_SLUG["coaching-agreement"].version;
