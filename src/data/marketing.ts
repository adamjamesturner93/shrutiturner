export type CoachingTierId = "independent-plan" | "coached-plan" | "coaching";

export type CoachingPurchaseModel = "self-serve" | "application";

export type CoachingSupportLevel = "async" | "moderate" | "high";

export interface CoachingTierMarketing {
  id: CoachingTierId;
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
    id: "independent-plan",
    name: "Independent Training Plan",
    tagline: "Expert programming, your schedule",
    description:
      "Tailored training delivered through Everfit for clients who want smart structure without live coaching every week.",
    priceLabel: "£60 / month",
    priceNote: "Minimum 3-month commitment",
    supportLevel: "async",
    purchaseModel: "self-serve",
    includesMembership: false,
    ctaHref: "/coaching/personal-programme",
    ctaLabel: "Get Started",
    features: [
      "Personalised training programme via Everfit",
      "Three-tier programming for optimal, moderate, and survival days",
      "Monthly written check-in and plan update",
      "Programme adjusted around your feedback and symptoms",
    ],
  },
  {
    id: "coached-plan",
    name: "Coached Training Plan",
    tagline: "Guided progress with regular support",
    description:
      "For people who want expert programming plus more regular review, accountability, and access to Move Well Membership.",
    priceLabel: "£200 / month",
    priceNote: "Includes Move Well Membership",
    supportLevel: "moderate",
    purchaseModel: "application",
    includesMembership: true,
    ctaHref: "/coaching/apply?tier=coached-plan",
    ctaLabel: "Apply Now",
    features: [
      "Everything in Independent Training Plan",
      "Weekly written check-in and plan review",
      "Monthly group coaching call",
      "Move Well Membership included",
      "Programming updated week to week when needed",
    ],
  },
  {
    id: "coaching",
    name: "1:1 Coaching",
    tagline: "The full picture, not just the training",
    description:
      "Highest-touch support for clients who need strategic oversight, closer accountability, and a coaching relationship built around a complex body.",
    priceLabel: "£350 / month",
    priceNote: "Includes Move Well Membership and messaging support",
    supportLevel: "high",
    purchaseModel: "application",
    includesMembership: true,
    ctaHref: "/coaching/apply?tier=coaching",
    ctaLabel: "Apply Now",
    features: [
      "Everything in Coached Training Plan",
      "Weekly written check-in and plan update",
      "Monthly 1:1 coaching call with Shruti",
      "Messaging support between sessions",
      "Highest-touch, most personalised support",
    ],
  },
];

export const personalProgrammeJourney: JourneyStep[] = [
  {
    step: 1,
    title: "Choose your plan",
    description: "Start with the Independent Training Plan and create your account.",
  },
  {
    step: 2,
    title: "Complete intake",
    description: "Share your goals, symptom picture, training history, and current capacity.",
  },
  {
    step: 3,
    title: "Get set up in Everfit",
    description: "Your programme, habits, and check-ins are delivered in the Everfit app.",
  },
  {
    step: 4,
    title: "Train and review",
    description: "Follow your plan, submit your monthly check-in, and get your next update.",
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
    title: "Onboarding",
    description: "Complete intake, connect Everfit, and get your support rhythm set up.",
  },
  {
    step: 4,
    title: "Coached support begins",
    description: "Regular check-ins, programme updates, and live support start from day one.",
  },
];

export const coachingFaqs: CoachingFaq[] = [
  {
    slug: "which-tier",
    question: "How do I know which coaching tier is right for me?",
    answer:
      "Independent Training Plan suits people who want expert programming with low-touch review. Coached Training Plan is for clients who want regular accountability and Move Well Membership included. 1:1 Coaching is the highest-touch option for more complex or fluctuating cases.",
  },
  {
    slug: "everfit",
    question: "Why is Everfit part of the coaching offer?",
    answer:
      "Everfit is where your workouts, habit tracking, check-ins, and programme delivery live. The website remains the main service hub, while Everfit handles the day-to-day training experience.",
  },
  {
    slug: "commitment",
    question: "Is there a minimum commitment?",
    answer:
      "Yes. All coaching tiers are designed around a minimum 3-month commitment so there is time to build capacity, review how your body responds, and adapt the plan meaningfully.",
  },
  {
    slug: "membership",
    question: "Do all coaching tiers include Move Well Membership?",
    answer:
      "No. Move Well Membership is included with Coached Training Plan and 1:1 Coaching. The Independent Training Plan keeps classes optional so it stays lower-friction and more affordable.",
  },
];

export const themedWeekPromos: Array<{
  slug: string;
  title: string;
  shortDescription: string;
  audience: string;
  ctaHref: string;
  ctaLabel: string;
  status: "draft" | "scheduled" | "active" | "archived";
}> = [];
