import type { CoachingApplicationPayloadTier, CoachingOfferKey } from "@/data/marketing";

export type CoachingApplicationTier = CoachingOfferKey;

export type CoachingApplicationOption = {
  value: string;
  label: string;
};

export type CoachingApplicationQuestion = {
  id: string;
  label: string;
  type: "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: CoachingApplicationOption[];
  tiers?: CoachingApplicationTier[];
};

export const coachingApplicationTierOptions: Array<{
  value: CoachingApplicationTier;
  title: string;
  description: string;
  payloadTier: CoachingApplicationPayloadTier;
}> = [
  {
    value: "guided_accountability",
    title: "Guided Accountability",
    description: "Lighter-touch accountability and review prompts for people with their own plan.",
    payloadTier: "personal_programme",
  },
  {
    value: "independent_training_plan",
    title: "Independent Training Plan",
    description: "Tailored programme writing and monthly review delivered through Everfit.",
    payloadTier: "personal_programme",
  },
  {
    value: "guided_training_plan",
    title: "Guided Training Plan",
    description: "Bespoke programming plus closer written review and accountability.",
    payloadTier: "coached_plan",
  },
  {
    value: "one_to_one_coaching",
    title: "1:1 Offers",
    description: "Highest-touch coaching with messaging, reactive adjustments and a monthly call.",
    payloadTier: "coaching",
  },
];

export const coachingApplicationQuestions: CoachingApplicationQuestion[] = [
  {
    id: "trainingEvent",
    label: "Do you have a life or sporting event you are training for?",
    type: "textarea",
    required: true,
    placeholder:
      "For example: wedding, 10K race, HYROX, hiking trip, surgery prep, or something else.",
    helpText:
      "Recreational events and amateur sport goals are welcome. Paid or professional athletic performance support may sit outside Shruti's insurance scope, so please mention it here if relevant.",
  },
  {
    id: "conditions",
    label:
      "Please share any chronic or acute injuries or conditions you are living with to help me tailor support for you.",
    type: "textarea",
    required: true,
    placeholder:
      "Share anything relevant to pain, fatigue, hypermobility, autoimmune disease, flare patterns, recent injuries, medication changes, or other context that affects how you train.",
  },
  {
    id: "typicalWeek",
    label: "What does a typical week of activity/work look like for you?",
    type: "textarea",
    required: true,
    placeholder:
      "Include work patterns, movement, sport, classes, rest, care responsibilities, commuting, or anything that shapes your week.",
  },
  {
    id: "scheduleConsiderations",
    label: "Are there any schedule considerations I should take into account when supporting you?",
    type: "textarea",
    required: true,
    placeholder:
      "Tell me about shift patterns, appointments, travel, school runs, energy fluctuations, preferred training days, or time constraints.",
  },
  {
    id: "equipment",
    label: "What equipment or training access do you have?",
    type: "textarea",
    required: true,
    placeholder: "Gym access, home weights, bands, machines, space constraints...",
  },
  {
    id: "anythingElse",
    label: "Anything else you would like me to know?",
    type: "textarea",
    placeholder: "Optional, but useful if there is context not covered above.",
  },
  {
    id: "heardAbout",
    label: "How did you hear about me?",
    type: "textarea",
    required: true,
    placeholder: "Instagram, Google, referral, class, event, newsletter, another practitioner...",
  },
];
