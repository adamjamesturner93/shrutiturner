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

const EFFECTIVE_DATE = "2026-08-13";
const VERSION = "2026-08-13";
const HEALTH_DATA_CONSENT_VERSION = "2026-03-12";

export const HEALTH_DATA_CONSENT = {
  version: HEALTH_DATA_CONSENT_VERSION,
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
    seoTitle: "Terms & Conditions | Shruti Turner",
    seoDescription:
      "Terms and conditions for Shruti Turner coaching, training, yoga, workshops, retreats, events and digital resources.",
    body: `1. About these terms

These Terms & Conditions govern your use of the Shruti Turner website, your account and any services you buy, book or access. This includes personal training and coaching, movement and yoga services, workshops, retreats and other events, and educational or digital resources.

By creating an account, booking or buying a service, or using the website, you agree to these terms.

2. Who we are

Shruti Turner provides movement, personal training and coaching, yoga, workshops, retreats and related educational services for adults.

For general enquiries, email shruti@shrutiturner.co.uk.

3. Eligibility and account information

You must be 18 or over to create an account or buy services through this website.

You must provide accurate information when you create an account, complete health forms, enquire about or book services, or make payments. You are responsible for keeping your login details secure and for activity through your account.

Services are intended for adults seeking recreational fitness, wellbeing, health-sensitive movement support, injury recovery or prevention, or amateur sport support. They are not professional athlete performance coaching or preparation for paid professional sport.

4. Service overview

Services may include:
- personal training and coaching
- movement and yoga sessions
- workshops, retreats and other events
- educational and digital resources

Specific inclusions, prices, time commitments and delivery arrangements are shown on the relevant service page, proposal or booking information at the time you agree to proceed.

5. Health, safety and scope

Services are educational movement, training and coaching services. They are not medical diagnosis, clinical rehabilitation, medical treatment, emergency care or a substitute for advice from your GP, consultant, physiotherapist or another regulated healthcare professional.

You are responsible for:
- deciding whether participation is appropriate for you
- seeking medical advice where needed
- providing accurate and current health information
- stopping any activity that feels unsafe
- telling us if your symptoms, diagnosis, medication or capacity changes

We may refuse, limit, pause or end participation where we reasonably believe a service is unsafe, unsuitable, outside Shruti Turner's training or insurance scope, or requires further medical input.

6. Health & Liability Waiver

Participation is subject to the Health & Liability Waiver published at /health-declaration. Where a service requires additional health or screening information, you agree to complete it honestly and promptly.

7. Accounts and platform use

You may not impersonate another person, share access to paid services inappropriately, copy protected resources or interfere with the security or operation of the platform.

We may suspend or restrict access where we reasonably suspect misuse, fraud, abuse or behaviour that creates risk for clients, collaborators or the business.

8. Personal training and coaching

Your service description or proposal sets out the level of contact, review frequency, programme access and any sessions included. Coaching supports decision-making and progression, but results cannot be guaranteed.

You remain responsible for how you use guidance between reviews and for raising changes in health, symptoms, capacity or circumstances that may affect your plan.

Cancellation, rescheduling and expiry terms for any booked sessions are provided before you commit and are also covered by the Refund & Cancellation Policy.

9. Workshops, retreats and events

Event-specific information may include deposits, staged payments, accommodation, travel, minimum numbers and cancellation deadlines. Those details form part of your agreement when you book.

You are responsible for travel, insurance, visas, medication and personal expenses unless the event information expressly says otherwise.

We may make reasonable changes to a venue, timetable, facilitator or activity where needed for safety or delivery. If we cancel an event, the event-specific terms and Refund & Cancellation Policy apply.

10. Prices and payment

Prices are shown in pounds sterling unless stated otherwise. Payment may be taken through Stripe or another provider identified at checkout or on an invoice.

You authorise the payment provider to process the agreed payment. If a payment fails or becomes overdue, access or delivery may be paused until the account is brought up to date.

11. Cancellations and refunds

The Refund & Cancellation Policy published at /refund-policy forms part of these terms. Your statutory consumer rights are not affected.

12. Intellectual property

Website copy, programmes, videos, recordings, worksheets, guides and other materials remain the intellectual property of Shruti Turner or the identified rights holder.

Unless expressly agreed otherwise, you receive a personal, non-transferable right to use materials for your own participation. You may not reproduce, resell, publish, distribute or teach from them without written permission.

13. Acceptable use and conduct

You must treat Shruti, other participants, collaborators and staff respectfully. Harassment, discrimination, threats, unsafe behaviour, unauthorised recording or deliberate disruption may lead to removal without refund where proportionate.

The Acceptable Use Policy published at /acceptable-use applies to website accounts and digital services.

14. Liability

Nothing in these terms excludes liability that cannot lawfully be excluded, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation.

Subject to that, Shruti Turner is not responsible for indirect or unforeseeable loss, loss caused by inaccurate or withheld information, failure to follow safety guidance, third-party services outside reasonable control, or activity undertaken outside the agreed service scope.

15. Changes to services or terms

We may update services, platform features or these terms where reasonably necessary. Material changes will be communicated where required and the current version will remain available on this website.

16. Governing law

These terms are governed by the laws of England and Wales. The courts of England and Wales will have jurisdiction, subject to any mandatory consumer rights that apply where you live.

Questions about these terms can be sent to shruti@shrutiturner.co.uk.`,
  },
  {
    id: "legal-privacy",
    slug: "privacy",
    title: "Privacy Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Privacy Policy | Shruti Turner",
    seoDescription: "How Shruti Turner collects, uses, stores and protects personal information.",
    body: `1. Who we are

Shruti Turner is the data controller for personal information processed through this website and the services described here.

For privacy questions, email shruti@shrutiturner.co.uk.

2. Information we collect

Depending on how you use the website and services, we may collect:
- name, email address, phone number and contact preferences
- account and authentication information
- enquiry, consultation and coaching information
- health, accessibility and movement information you choose to provide
- workshop, retreat or event booking details
- payment status and transaction references supplied by payment providers
- newsletter consent and email engagement information
- messages, feedback and support correspondence
- technical information such as IP address, browser, device and security logs

3. Special-category health information

Health information is special-category personal data. Where it is needed to deliver a service safely, we process it with your explicit consent and only for the purposes explained when it is collected.

You may withdraw consent, but doing so may mean we cannot safely continue the relevant service. Legal obligations and records already required to establish or defend legal claims may still apply.

4. How we use information

We use personal information to:
- respond to enquiries and recommend suitable support
- provide coaching, training, yoga, workshops, retreats and events
- manage accounts, payments and service communications
- tailor services to health, access and capacity information
- send marketing where you have consented
- keep the website secure, prevent misuse and meet legal obligations
- understand and improve our services

5. Lawful bases

We rely on contract where processing is needed to provide a service, consent for marketing and special-category health information, legitimate interests for proportionate administration and security, and legal obligation where records must be retained or disclosed.

6. Service providers

We use carefully selected providers for website hosting, authentication, email, payments, coaching delivery, analytics, content and security. Providers process only the information needed for their function and are subject to contractual or equivalent safeguards.

Some providers may process data outside the United Kingdom. Where this occurs, we use recognised safeguards such as adequacy regulations or approved contractual clauses.

7. Sharing information

We do not sell personal data. Information may be shared with service providers, professional advisers, event partners where necessary and disclosed to authorities where required by law or to protect safety and legal rights.

8. Retention

We keep information only as long as reasonably needed for the purpose collected, contractual and insurance records, tax and accounting requirements, safety, disputes and legal claims. Retention periods vary by record type.

9. Your rights

Depending on the circumstances, you may have rights to access, correct, erase, restrict or object to processing, receive portable data, and withdraw consent. You may also complain to the UK Information Commissioner's Office.

10. Security

We use reasonable technical and organisational measures to protect personal information. No online system is completely secure, so please use a unique sign-in method and tell us promptly if you suspect unauthorised account access.

11. Changes and contact

We may update this policy as services or legal requirements change. The current version and effective date are shown on this page.

To exercise a privacy right or ask a question, email shruti@shrutiturner.co.uk.`,
  },
  {
    id: "legal-cookies",
    slug: "cookies",
    title: "Cookie Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Cookie Policy | Shruti Turner",
    seoDescription: "How the Shruti Turner website uses cookies and similar technologies.",
    body: `1. What this policy covers

This policy explains how the Shruti Turner website uses cookies and similar technologies in browsers and devices.

2. What cookies are

Cookies are small text files stored by your browser. Similar local-storage and security technologies may remember choices, maintain a session or protect a form.

3. Necessary and functional technologies

The website may use necessary or functional technologies to:
- keep accounts signed in securely
- remember privacy and interface choices
- protect forms from spam and abuse
- maintain checkout and payment state
- support accessibility and core website functions

These technologies are used only where needed to provide a feature, protect the service or remember a choice you made.

4. Third-party services

Providers such as Auth.js, Google, Stripe, Postmark, Contentful, Vercel and Cloudflare Turnstile may set or read cookies or similar identifiers when their features are used. Their own privacy and cookie information applies to their processing.

5. Analytics and marketing

Non-essential analytics or marketing technologies will be used only where a lawful basis and any required consent are in place. The available cookie controls will reflect the technologies active on the website.

6. Managing cookies

You can remove or block cookies through your browser. Blocking necessary cookies may prevent sign-in, forms, checkout or other parts of the website from working correctly.

7. Changes to this policy

We may update this policy when website technology or legal requirements change. The current version and effective date are shown on this page.

8. Contact

Questions about cookies can be sent to shruti@shrutiturner.co.uk.`,
  },
  {
    id: "legal-health-declaration",
    slug: "health-declaration",
    title: "Health & Liability Waiver",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Health & Liability Waiver | Shruti Turner",
    seoDescription: "Health, safety and participation responsibilities for Shruti Turner services.",
    body: `1. Understanding the service

Shruti Turner's services include movement, personal training and coaching, yoga, workshops, retreats and related education. They may be rehabilitation-informed, but they are not medical diagnosis, clinical rehabilitation, medical treatment or emergency care.

2. Your health information

You agree to provide accurate and relevant information about health conditions, pain, injuries, symptoms, medication, pregnancy, access needs and other factors that could affect participation.

You agree to tell Shruti if this information or your capacity changes.

3. Your responsibility during participation

You remain responsible for deciding whether an activity feels appropriate. You agree to work within your current capacity, follow safety guidance, use equipment appropriately and stop if you feel unsafe, unwell or experience concerning symptoms.

4. Medical advice

You should seek advice from a qualified healthcare professional where you have concerns about starting or continuing exercise. Shruti may ask for medical clearance or decline, adapt or pause a service where further clinical input appears necessary.

5. Inherent risk

Movement and exercise carry inherent risks, including fatigue, soreness, symptom flare, strain, falls and injury. Risk cannot be removed entirely even where reasonable care and adaptations are used.

6. Liability boundary

Nothing in this waiver excludes liability that cannot lawfully be excluded. Subject to that, Shruti Turner is not responsible for harm arising from inaccurate or withheld information, disregarding safety guidance, participating outside the agreed scope, or continuing after you have been advised to stop.

7. Consent

By accepting this waiver during onboarding or booking, you confirm that you understand the service boundary, have had the opportunity to ask questions and agree to the responsibilities above.`,
  },
  {
    id: "legal-refund-policy",
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Refund & Cancellation Policy | Shruti Turner",
    seoDescription: "Cancellation, rescheduling and refund terms for Shruti Turner services.",
    body: `1. General approach

This policy explains the usual cancellation and refund position for Shruti Turner services. Service-specific terms shown in a proposal, booking page or event information also form part of your agreement.

Nothing in this policy limits your statutory consumer rights.

2. Personal training and coaching

Any initial commitment, notice period, session rescheduling window and expiry date will be confirmed before you agree to proceed.

Once personalised planning, review or coaching work has begun, charges already earned for work delivered are normally non-refundable. If a booked session is cancelled late or missed, it may be treated as used where the agreed service terms say so.

3. Workshops and events

Cancellation and transfer deadlines are shown with the event information. Where a place can be transferred, you remain responsible for giving accurate attendee information and meeting any health or eligibility requirements.

If Shruti Turner cancels an event, you will be offered the remedy described in the event terms, normally a transfer, credit or refund of the amount paid for the cancelled service. Consequential costs such as travel or accommodation are not covered unless the law requires otherwise.

4. Retreats

Retreat bookings may require a non-refundable deposit and staged balance payments. The booking page will state the relevant deadlines and what is refundable at each stage.

You are strongly encouraged to arrange suitable travel insurance. Unless expressly included, travel, insurance, visas and personal expenses remain your responsibility.

5. Digital resources

Where you request immediate access to digital content during a statutory cancellation period, you may be asked to acknowledge that the cancellation right can be lost once supply begins, as permitted by consumer law.

6. Illness, health changes and fluctuating capacity

Please contact Shruti as early as possible if illness, injury, a change in health or fluctuating capacity affects participation. Where practical, Shruti may offer an adaptation, reschedule, credit or pause, but this depends on the service, notice given, work already completed and unrecoverable costs.

7. How refunds are paid

Approved refunds are normally returned to the original payment method. Processing times depend on the payment provider and bank. Transaction or currency-conversion differences outside our control may not be recoverable.

8. Contact

To discuss a cancellation, email shruti@shrutiturner.co.uk with the service, booking details and relevant dates.`,
  },
  {
    id: "legal-acceptable-use",
    slug: "acceptable-use",
    title: "Acceptable Use Policy",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Acceptable Use Policy | Shruti Turner",
    seoDescription: "Rules for using Shruti Turner accounts, resources and digital services.",
    body: `1. Purpose

This policy protects clients, collaborators, Shruti Turner and the security of website accounts and digital services.

2. Account security

Keep your sign-in details and verification codes private. Do not access another person's account, attempt to bypass security controls or misrepresent your identity.

3. Respectful conduct

Do not harass, threaten, discriminate against or deliberately disrupt Shruti, another participant, a collaborator or staff member. Communications must remain relevant and respectful.

4. Content and intellectual property

Do not copy, record, scrape, republish, sell, distribute or teach from protected programmes, videos, resources or communications without written permission.

5. Technical misuse

Do not introduce malware, automate abusive requests, probe for vulnerabilities, interfere with availability, evade rate limits or use the service for unlawful activity.

6. Privacy

Do not share another person's private information, images, messages or health details without their permission. Do not make unauthorised recordings of calls, sessions or events.

7. Enforcement

We may remove content, limit features, suspend access or close an account where reasonably necessary to protect people, rights or systems. Serious or unlawful behaviour may be reported to the relevant authorities.

8. Contact

Report a security or acceptable-use concern to shruti@shrutiturner.co.uk.`,
  },
  {
    id: "legal-coaching-agreement",
    slug: "coaching-agreement",
    title: "Coaching Agreement",
    version: VERSION,
    effectiveDate: EFFECTIVE_DATE,
    seoTitle: "Coaching Agreement | Shruti Turner",
    seoDescription:
      "Working agreement for personalised movement, training and coaching with Shruti Turner.",
    body: `1. Purpose of this agreement

This agreement sets clear expectations for personalised movement, personal training and coaching services delivered by Shruti Turner.

2. Your coaching service

Your proposal or onboarding information identifies your level of support, contact rhythm, review frequency, included sessions, programme access, price and any initial commitment.

The amount of contact may vary by service level. The professional care, individual consideration and responsibility to work within scope do not.

3. Starting well

You agree to provide accurate information about your goals, movement history, health, symptoms, medication, access needs, available equipment and circumstances. The initial approach is based on this information and may change as Shruti learns more about you.

4. Communication and reviews

Use the agreed channel for check-ins, questions and feedback. Response windows and review days are described in your service information and are not an emergency service.

Tell Shruti promptly when pain, symptoms, health, confidence, schedule, equipment or other circumstances affect the plan. Adaptation depends on receiving enough context to make an informed decision.

5. Your programme and resources

Your programme, check-ins and resources may be delivered through Everfit or another identified tool so that they are easy to access. Shruti is the coaching service; the platform is an administrative and delivery tool.

Programmes and resources are personal to you and may not be shared, copied, sold or distributed without written permission.

6. Health and clinical boundaries

Coaching may be rehabilitation-informed, but it is not medical diagnosis, clinical rehabilitation, medical treatment, psychotherapy or emergency care. Shruti may recommend medical or clinical input, request clearance, or pause or decline work outside her training or insurance scope.

The Health & Liability Waiver at /health-declaration also applies.

7. Sessions, changes and missed contact

Where your service includes appointments, the rescheduling window and treatment of missed sessions are stated before onboarding. Late changes may count as used where agreed.

If you do not check in or train for a period, Shruti will make reasonable efforts within the agreed service but cannot guarantee progress or recreate unused time outside the service terms.

8. Fees, cancellation and refunds

Fees and payment timing are confirmed before onboarding. The Refund & Cancellation Policy at /refund-policy applies alongside any service-specific commitment or notice period.

9. Results and responsibility

Shruti will provide professional, evidence-informed coaching with reasonable care and skill. Outcomes depend on many factors and cannot be guaranteed.

You remain responsible for your choices, participation, use of guidance and decision to seek medical advice where appropriate.

10. Confidentiality and data

Personal and health information is handled according to the Privacy Policy. Confidentiality may be limited where disclosure is required by law or reasonably necessary to protect someone from serious harm.

11. Ending the coaching relationship

Either party may end coaching in line with the agreed notice and cancellation terms. Shruti may end or pause the relationship sooner where there is non-payment, unsafe participation, abusive conduct, repeated boundary breaches, loss of trust or work outside professional scope.

12. Acceptance

By accepting this agreement during onboarding, you confirm that you have read it, the relevant service information, the Terms & Conditions, Privacy Policy, Refund & Cancellation Policy and Health & Liability Waiver, and have had the opportunity to ask questions.`,
  },
];

export function getLegalDocumentSeed(slug: LegalDocumentSlug) {
  return LEGAL_DOCUMENTS.find((document) => document.slug === slug) || null;
}

export const LEGAL_DOCUMENTS_BY_SLUG = Object.fromEntries(
  LEGAL_DOCUMENTS.map((document) => [document.slug, document])
) as Record<LegalDocumentSlug, LegalDocumentSeed>;

export const CURRENT_TERMS_VERSION = LEGAL_DOCUMENTS_BY_SLUG.terms.version;
export const CURRENT_HEALTH_WAIVER_VERSION = LEGAL_DOCUMENTS_BY_SLUG["health-declaration"].version;
export const CURRENT_HEALTH_DATA_CONSENT_VERSION = HEALTH_DATA_CONSENT.version;
export const CURRENT_COACHING_AGREEMENT_VERSION =
  LEGAL_DOCUMENTS_BY_SLUG["coaching-agreement"].version;
