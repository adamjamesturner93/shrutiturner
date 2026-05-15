export type CoachingOfferKey =
  | "guided_accountability"
  | "independent_training_plan"
  | "guided_training_plan"
  | "one_to_one_coaching";

export type CoachingTierId = CoachingOfferKey;

export type CoachingPurchaseModel = "application_required";

export type CoachingSupportLevel = "accountability" | "programme" | "guided" | "high";

export type CoachingApplicationPayloadTier = "personal_programme" | "coached_plan" | "coaching";

export interface CoachingTierMarketing {
  id: CoachingTierId;
  applicationTier: CoachingApplicationPayloadTier;
  name: string;
  tagline: string;
  description: string;
  priceLabel: string;
  priceNote: string;
  supportLevel: CoachingSupportLevel;
  purchaseModel: CoachingPurchaseModel;
  includesMembership: boolean;
  ctaHref: string;
  ctaLabel: string;
  features: string[];
  boundaries: string[];
  expectedNextStep: string;
}

export interface JourneyStep {
  step: number;
  title: string;
  description: string;
}

export interface CoachingFaq {
  slug: string;
  question: string;
  answer: string;
}

export const coachingTiers: CoachingTierMarketing[] = [
  {
    id: "guided_accountability",
    applicationTier: "personal_programme",
    name: "Guided Accountability",
    tagline: "A lighter coaching rhythm for staying consistent",
    description:
      "For people who already know broadly what they are doing but need structure, review prompts, and a clearer accountability container.",
    priceLabel: "£70 / month",
    priceNote: "Application required before payment",
    supportLevel: "accountability",
    purchaseModel: "application_required",
    includesMembership: false,
    ctaHref: "/coaching/apply?offer=guided_accountability",
    ctaLabel: "Apply First",
    features: [
      "Accountability rhythm inside Everfit",
      "Monthly written reflection and direction",
      "Clear boundaries for when to adjust or ask for help",
      "Best when you do not need a fully written training plan",
    ],
    boundaries: [
      "Does not include bespoke programme writing",
      "Does not include Move Well Membership",
    ],
    expectedNextStep: "Submit a short application so Shruti can check fit and boundaries.",
  },
  {
    id: "independent_training_plan",
    applicationTier: "personal_programme",
    name: "Independent Training Plan",
    tagline: "Expert programming, reviewed monthly",
    description:
      "Tailored training delivered through Everfit for clients who want smart structure without frequent live or written coaching.",
    priceLabel: "£90 / month",
    priceNote: "Application required before payment",
    supportLevel: "programme",
    purchaseModel: "application_required",
    includesMembership: false,
    ctaHref: "/coaching/apply?offer=independent_training_plan",
    ctaLabel: "Apply First",
    features: [
      "Personalised training programme via Everfit",
      "Good-day, average-day, and survival-day planning",
      "Monthly written check-in and plan update",
      "Programme adjusted around your feedback and symptoms",
    ],
    boundaries: ["Does not include weekly review", "Does not include Move Well Membership"],
    expectedNextStep:
      "Apply with training context, equipment, preferences, and health considerations.",
  },
  {
    id: "guided_training_plan",
    applicationTier: "coached_plan",
    name: "Guided Training Plan",
    tagline: "Programming plus closer review",
    description:
      "For people who want a written training plan plus more regular accountability, expectation-setting, and adaptation support.",
    priceLabel: "£130 / month",
    priceNote: "Application required before payment",
    supportLevel: "guided",
    purchaseModel: "application_required",
    includesMembership: false,
    ctaHref: "/coaching/apply?offer=guided_training_plan",
    ctaLabel: "Apply First",
    features: [
      "Everything in Independent Training Plan",
      "More regular written check-ins",
      "Support needs and expectations agreed up front",
      "Clearer accountability around consistency and adaptation",
    ],
    boundaries: [
      "Does not include ongoing 1:1 messaging access",
      "Does not include Move Well Membership by default",
    ],
    expectedNextStep:
      "Apply with goals, health context, support needs, availability, and expectations.",
  },
  {
    id: "one_to_one_coaching",
    applicationTier: "coaching",
    name: "1:1 Coaching",
    tagline: "The highest-touch support",
    description:
      "For clients who need strategic oversight, closer accountability, and a coaching relationship built around a complex or fluctuating body.",
    priceLabel: "£180 / month",
    priceNote: "Application required before payment",
    supportLevel: "high",
    purchaseModel: "application_required",
    includesMembership: true,
    ctaHref: "/coaching/apply?offer=one_to_one_coaching",
    ctaLabel: "Apply First",
    features: [
      "Everything in Guided Training Plan",
      "Monthly 1:1 coaching call with Shruti",
      "Messaging expectations agreed before payment",
      "Move Well Membership included after successful payment",
      "Highest-touch, most strategic support",
    ],
    boundaries: [
      "Coaching is not emergency, crisis, medical, or rehabilitation care",
      "Move Well Membership starts only after verified payment",
    ],
    expectedNextStep: "Apply with complexity, call availability, and messaging expectations.",
  },
];

export const personalProgrammeJourney: JourneyStep[] = [
  {
    step: 1,
    title: "Apply first",
    description: "Share enough context for Shruti to confirm the offer is a good fit.",
  },
  {
    step: 2,
    title: "Receive the right invite",
    description: "If accepted, you receive the correct payment invitation for the agreed offer.",
  },
  {
    step: 3,
    title: "Pay securely",
    description: "Subscription checkout starts only from an accepted application.",
  },
  {
    step: 4,
    title: "Use Everfit",
    description: "Programming, check-ins, and coaching communication happen in Everfit.",
  },
];

export const applicationJourney: JourneyStep[] = [
  {
    step: 1,
    title: "Apply",
    description: "Tell us about your body, goals, training history, and the support you need.",
  },
  {
    step: 2,
    title: "Consultation",
    description: "We review fit, answer questions, and recommend the right support tier.",
  },
  {
    step: 3,
    title: "Payment invite",
    description: "If accepted, your payment link is tied to the approved offer and your account.",
  },
  {
    step: 4,
    title: "Everfit onboarding",
    description:
      "After verified payment, your Everfit setup starts or Shruti handles manual setup.",
  },
];

export const coachingFaqs: CoachingFaq[] = [
  {
    slug: "which-tier",
    question: "How do I know which coaching tier is right for me?",
    answer:
      "Apply for the closest fit. Guided Accountability is lighter-touch accountability, Independent Training Plan is bespoke programming with monthly review, Guided Training Plan adds more regular review, and 1:1 Coaching is the highest-touch option for more complex or fluctuating cases.",
  },
  {
    slug: "everfit",
    question: "Why is Everfit part of the coaching offer?",
    answer:
      "Everfit is where programme delivery, check-ins, and coaching communication live. The website handles discovery, applications, payment invitations, billing, cancellation requests, status, and links into Everfit.",
  },
  {
    slug: "commitment",
    question: "Is there a minimum commitment?",
    answer:
      "Coaching is billed monthly after acceptance and payment. Cancellation requires one month's notice; depending on your billing date, the next payment after notice may be your final payment.",
  },
  {
    slug: "membership",
    question: "Do all coaching tiers include Move Well Membership?",
    answer:
      "No. 1:1 Coaching includes Move Well Membership immediately after successful payment. The other coaching offers do not include membership unless Shruti explicitly agrees an admin override.",
  },
  {
    slug: "application-led",
    question: "Can I buy coaching instantly?",
    answer:
      "No. Coaching places are application-led. Public offer cards take you to an application, and subscription checkout is only created after admin acceptance.",
  },
];
