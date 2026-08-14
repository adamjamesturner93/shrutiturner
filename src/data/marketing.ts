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
  active: boolean;
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
    priceNote: "Enquire before payment",
    supportLevel: "accountability",
    purchaseModel: "application_required",
    ctaHref: "/coaching/enquire",
    ctaLabel: "Enquire First",
    features: [
      "Weekly check-in via app",
      "Guidance around training structure and recovery",
      "Space to reflect and ask questions",
    ],
    boundaries: [
      "Does not include a tailored training programme",
      "Does not include nutrition guidance",
    ],
    expectedNextStep: "Start with an enquiry so Shruti can understand fit and boundaries.",
    active: false,
  },
  {
    id: "independent_training_plan",
    applicationTier: "personal_programme",
    name: "Monthly Support",
    tagline: "Monthly review & coaching",
    description: "For people who are happy working independently between planned reviews.",
    bestFor: "People who are happy working independently between planned reviews.",
    whatItIs: "A personalised training programme with a monthly review and coaching call.",
    priceLabel: "£95 / month",
    priceNote: "Enquire before payment",
    supportLevel: "programme",
    purchaseModel: "application_required",
    ctaHref: "/coaching/enquire",
    ctaLabel: "Enquire First",
    features: [
      "Personalised training programme across your week",
      "Monthly programme review and updates",
      "30-minute coaching call with Shruti each month",
      "Check-in and feedback through Everfit",
      "Exercise comments for questions or feedback between reviews",
    ],
    boundaries: ["Does not include weekly review", "Does not include nutrition guidance"],
    expectedNextStep:
      "Enquire with your training context, equipment, preferences and health considerations.",
    active: true,
  },
  {
    id: "guided_training_plan",
    applicationTier: "coached_plan",
    name: "Weekly Support",
    tagline: "Weekly review & coaching",
    description: "For people who want more regular review, feedback and support as they train.",
    bestFor: "People who want more regular review, feedback and support as they train.",
    whatItIs:
      "A personalised home or gym training programme with weekly review and ongoing progression support.",
    priceLabel: "£130 / month",
    priceNote: "Enquire before payment",
    supportLevel: "guided",
    purchaseModel: "application_required",
    ctaHref: "/coaching/enquire",
    ctaLabel: "Enquire First",
    features: [
      "Personalised training programme across your week",
      "Weekly programme review and updates",
      "30-minute coaching call with Shruti each month",
      "Check-in and feedback through Everfit",
      "Exercise comments for questions or feedback between reviews",
      "Nutrition guidance",
    ],
    boundaries: ["Does not include ongoing 1:1 messaging access"],
    expectedNextStep:
      "Enquire with your goals, health context, support needs, availability and expectations.",
    active: true,
  },
  {
    id: "one_to_one_coaching",
    applicationTier: "coaching",
    name: "1:1 Coaching",
    tagline: "Responsive, collaborative coaching",
    description:
      "For people wanting high-support coaching for navigating training, nutrition, health and real life together.",
    bestFor:
      "People wanting high-support coaching for navigating training, nutrition, health and real life together.",
    whatItIs:
      "Ongoing collaborative coaching support designed around your body, goals, lifestyle and capacity.",
    priceLabel: "£180 / month",
    priceNote: "Enquire before payment",
    supportLevel: "high",
    purchaseModel: "application_required",
    ctaHref: "/coaching/enquire",
    ctaLabel: "Enquire First",
    features: [
      "Personalised training programme across your week",
      "Reactive programme adjustments as your needs change",
      "30-minute coaching call with Shruti each month",
      "Check-in and feedback through Everfit",
      "Ongoing direct messaging through Everfit, typically answered within 24 hours",
      "Nutrition guidance",
      "More collaborative planning and adaptation",
    ],
    boundaries: ["Coaching is not emergency, crisis, medical or rehabilitation care"],
    expectedNextStep:
      "Enquire with your health context, call availability and messaging expectations.",
    active: true,
  },
];

export const allCoachingTiers = coachingTiers;
export const activeCoachingTiers = coachingTiers.filter((tier) => tier.active);

export const applicationJourney: JourneyStep[] = [
  {
    step: 1,
    title: "Enquire",
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
    description: "Once agreed, your payment link is tied to the right offer and your account.",
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
      "You do not need to choose before enquiring. After your consultation, Shruti will recommend Monthly Support, Weekly Support or 1:1 Coaching based on the guidance, feedback and conversation you need.",
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
      "No. Start with an enquiry and consultation so Shruti can recommend the appropriate level of support. Payment opens once you have agreed the right next step together.",
  },
];
