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
  bestFor: string;
  whatItIs: string;
  priceLabel: string;
  priceNote: string;
  supportLevel: CoachingSupportLevel;
  purchaseModel: CoachingPurchaseModel;
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
    tagline: "Regular guidance for training around real life",
    description:
      "For people already exercising who want guidance, accountability and support navigating training around real life.",
    bestFor:
      "People already exercising who want guidance, accountability and support navigating training around real life.",
    whatItIs:
      "Regular check-ins and guidance to help you reflect, adapt and structure your training week.",
    priceLabel: "£70 / month",
    priceNote: "Application required before payment",
    supportLevel: "accountability",
    purchaseModel: "application_required",
    ctaHref: "/coaching/apply?offer=guided_accountability",
    ctaLabel: "Apply First",
    features: [
      "Weekly check-in via app",
      "Guidance around training structure and recovery",
      "Space to reflect and ask questions",
    ],
    boundaries: ["Does not include a tailored training programme"],
    expectedNextStep: "Submit a short application so Shruti can check fit and boundaries.",
  },
  {
    id: "independent_training_plan",
    applicationTier: "personal_programme",
    name: "Independent Training Plan",
    tagline: "Personalised structure and progression",
    description: "Independent training with personalised structure and progression.",
    bestFor: "Independent training with personalised structure and progression.",
    whatItIs: "A personalised gym or home training programme with monthly support.",
    priceLabel: "£95 / month",
    priceNote: "Application required before payment",
    supportLevel: "programme",
    purchaseModel: "application_required",
    ctaHref: "/coaching/apply?offer=independent_training_plan",
    ctaLabel: "Apply First",
    features: [
      "Tailored programme via app",
      "Monthly check-in via app",
      "Monthly programme adjustments",
    ],
    boundaries: ["Does not include weekly review"],
    expectedNextStep:
      "Apply with training context, equipment, preferences and health considerations.",
  },
  {
    id: "guided_training_plan",
    applicationTier: "coached_plan",
    name: "Guided Training Plan",
    tagline: "Weekly review and progression support",
    description: "For people wanting more regular guidance and progression support.",
    bestFor: "People wanting more regular guidance and progression support.",
    whatItIs:
      "A personalised home or gym training programme with weekly review and ongoing progression support.",
    priceLabel: "£130 / month",
    priceNote: "Application required before payment",
    supportLevel: "guided",
    purchaseModel: "application_required",
    ctaHref: "/coaching/apply?offer=guided_training_plan",
    ctaLabel: "Apply First",
    features: [
      "Tailored programme via app",
      "Weekly check-in via app",
      "Weekly programme adjustments",
      "Greater accountability and progression support",
    ],
    boundaries: ["Does not include ongoing 1:1 messaging access"],
    expectedNextStep:
      "Apply with goals, health context, support needs, availability and expectations.",
  },
  {
    id: "one_to_one_coaching",
    applicationTier: "coaching",
    name: "1:1 Coaching",
    tagline: "High-support coaching for training, healthand real life",
    description:
      "For people wanting high-support coaching for navigating training, nutrition, healthand real life together.",
    bestFor:
      "People wanting high-support coaching for navigating training, nutrition, healthand real life together.",
    whatItIs:
      "Ongoing collaborative coaching support designed around your body, goals, lifestyle and capacity.",
    priceLabel: "£180 / month",
    priceNote: "Application required before payment",
    supportLevel: "high",
    purchaseModel: "application_required",
    ctaHref: "/coaching/apply?offer=one_to_one_coaching",
    ctaLabel: "Apply First",
    features: [
      "Tailored programme via app",
      "Weekly check-in via app",
      "Ongoing messaging support, typically within 24 hours",
      "Reactive adjustments as needed",
      "Monthly coaching call",
    ],
    boundaries: ["Coaching is not emergency, crisis, medical or rehabilitation care"],
    expectedNextStep: "Apply with health context, call availability and messaging expectations.",
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
    description: "Programming, check-ins and support communication happen in Everfit.",
  },
];

export const applicationJourney: JourneyStep[] = [
  {
    step: 1,
    title: "Apply",
    description: "Tell us about your body, goals, training history and the support you need.",
  },
  {
    step: 2,
    title: "Consultation",
    description: "We review fit, answer questions and recommend the right 1:1 offer.",
  },
  {
    step: 3,
    title: "Payment invite",
    description: "If accepted, your payment link is tied to the approved offer and your account.",
  },
  {
    step: 4,
    title: "Start your support",
    description: "After verified payment, delivery begins through Everfit.",
  },
];

export const coachingFaqs: CoachingFaq[] = [
  {
    slug: "which-tier",
    question: "How do I know which 1:1 offer is right for me?",
    answer:
      "Apply for the closest fit. Guided Accountability is lighter-touch accountability, Independent Training Plan is tailored programming with monthly review, Guided Training Plan adds weekly review and 1:1 Coaching is the highest-touch option for people who need a fuller coaching relationship.",
  },
  {
    slug: "everfit",
    question: "Why is Everfit part of the 1:1 offers?",
    answer:
      "Everfit keeps your programme, check-ins, habits and support communication in one place so the experience is easier to follow.",
  },
  {
    slug: "commitment",
    question: "Is there a minimum commitment?",
    answer:
      "1:1 offers are billed monthly after acceptance and payment. Cancellation requires one month's notice; depending on your billing date, the next payment after notice may be your final payment.",
  },
  {
    slug: "application-led",
    question: "Can I buy a 1:1 offer instantly?",
    answer:
      "No. 1:1 places are application-led. Public offer cards take you to an application and subscription checkout is only created after admin acceptance.",
  },
];
