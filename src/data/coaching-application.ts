export type CoachingApplicationTier = "coached-plan" | "coaching" | "unsure";

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
}> = [
  {
    value: "coached-plan",
    title: "Coached Training Plan",
    description: "Weekly written review, programming support, and Move Well Membership included.",
  },
  {
    value: "coaching",
    title: "1:1 Coaching",
    description: "Highest-touch support with programming, calls, review, and accountability.",
  },
  {
    value: "unsure",
    title: "I'm not sure yet",
    description: "I want help deciding which level of support fits my body and life best.",
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
    id: "membership",
    label: "Do you currently attend Move Well Classes or hold membership?",
    type: "select",
    required: true,
    options: [
      { value: "member", label: "Yes, I have membership" },
      { value: "credits", label: "Yes, I use credits or attend sometimes" },
      { value: "new", label: "No, I would be new to classes" },
    ],
  },
  {
    id: "coachedPlanContext",
    label: "What would make a coached training plan feel useful and sustainable?",
    type: "textarea",
    placeholder:
      "Tell us what kind of review, accountability, or adaptation would help you stay consistent.",
    tiers: ["coached-plan", "unsure"],
  },
  {
    id: "coachingContext",
    label: "Why does higher-touch coaching feel relevant right now?",
    type: "textarea",
    placeholder:
      "Tell us if you need closer oversight, strategy, accountability, more nuanced adaptation, or support around a particularly complex season.",
    tiers: ["coaching", "unsure"],
  },
  {
    id: "anythingElse",
    label: "Anything else you want us to know before we review your application?",
    type: "textarea",
    placeholder: "Optional, but useful if there is context not covered above.",
  },
];
