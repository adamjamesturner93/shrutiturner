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
    description: "Bespoke programme writing and monthly review inside Everfit.",
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
    title: "1:1 Coaching",
    description: "Highest-touch support with a monthly 1:1 call and membership after payment.",
    payloadTier: "coaching",
  },
];

export const coachingApplicationQuestions: CoachingApplicationQuestion[] = [
  {
    id: "goals",
    label: "What do you want training or coaching to support right now?",
    type: "textarea",
    required: true,
    placeholder:
      "Tell us what you want more of: confidence, strength, consistency, fewer flare-related setbacks, a better relationship with movement, or something else.",
  },
  {
    id: "conditions",
    label: "What symptoms, conditions, injuries, or complexity should we know about?",
    type: "textarea",
    required: true,
    placeholder:
      "Share anything relevant to pain, fatigue, hypermobility, autoimmune disease, flare patterns, injuries, medication changes, or other context that affects how you train.",
  },
  {
    id: "trainingExperience",
    label: "What is your current training experience?",
    type: "textarea",
    required: true,
    placeholder:
      "What are you doing now, what has or has not worked before, and how confident do you feel training independently?",
  },
  {
    id: "supportLevel",
    label: "What level of support feels most helpful right now?",
    type: "select",
    required: true,
    options: [
      { value: "light", label: "Light-touch structure and review" },
      { value: "moderate", label: "Regular guidance and accountability" },
      { value: "high", label: "Close oversight and ongoing calibration" },
      { value: "unsure", label: "I'm not sure yet" },
    ],
  },
  {
    id: "availability",
    label: "Anything we should know about your schedule, energy, or capacity?",
    type: "textarea",
    required: true,
    placeholder:
      "Let us know about work, care responsibilities, appointments, travel, fluctuating capacity, and when support is most realistic for you.",
  },
  {
    id: "equipment",
    label: "What equipment or training access do you have?",
    type: "textarea",
    required: true,
    placeholder: "Gym access, home weights, bands, machines, space constraints...",
    tiers: ["independent_training_plan", "guided_training_plan", "one_to_one_coaching"],
  },
  {
    id: "membership",
    label: "Do you currently attend Move Well Classes or hold membership?",
    type: "select",
    required: true,
    options: [
      { value: "member", label: "Yes, I have membership" },
      { value: "credits", label: "Yes, I use credits or attend sometimes" },
      { value: "new", label: "No, I would be new to classes" },
    ],
    tiers: ["one_to_one_coaching"],
  },
  {
    id: "coachedPlanContext",
    label: "What would make this level of guidance feel useful and sustainable?",
    type: "textarea",
    placeholder:
      "Tell us what kind of review, accountability, or adaptation would help you stay consistent.",
    tiers: ["guided_accountability", "guided_training_plan"],
  },
  {
    id: "coachingContext",
    label: "Why does higher-touch coaching feel relevant right now?",
    type: "textarea",
    placeholder:
      "Tell us if you need closer oversight, strategy, accountability, more nuanced adaptation, or support around a particularly complex season.",
    tiers: ["guided_training_plan", "one_to_one_coaching"],
  },
  {
    id: "callAvailability",
    label: "What availability do you usually have for a monthly 1:1 call?",
    type: "textarea",
    required: true,
    placeholder: "Days, time windows, timezone, and anything that changes month to month.",
    tiers: ["one_to_one_coaching"],
  },
  {
    id: "messagingExpectations",
    label: "What would you expect from messaging support?",
    type: "textarea",
    required: true,
    placeholder:
      "Share what you might message about, what response time would feel useful, and any boundaries you need clear.",
    tiers: ["one_to_one_coaching"],
  },
  {
    id: "anythingElse",
    label: "Anything else you want us to know before we review your application?",
    type: "textarea",
    placeholder: "Optional, but useful if there is context not covered above.",
  },
];
