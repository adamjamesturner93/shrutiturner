export interface RetreatDate {
  id: string;
  startDate: string;
  endDate: string;
  availableSpaces: number;
  totalSpaces: number;
}

export interface Retreat {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  location: string;
  imageUrl: string;
  shortDescription: string;
  fullDescription: string;
  dates: RetreatDate[];
  earlyBirdPrice: number;
  earlyBirdDeadline: string;
  normalPrice: number;
  currency: string;
  included: string[];
  notIncluded: string[];
  schedule: {
    day: string;
    activities: string[];
  }[];
  accommodation: string;
  suitableFor: string[];
}

export const retreats: Retreat[] = [
  {
    id: "1",
    title: "Sankalpa",
    subtitle: "A Yoga Retreat for Bodies That Require Nuance",
    slug: "sankalpa",
    location: "Portuguese Countryside",
    imageUrl: "yoga retreat portugal countryside",
    shortDescription:
      "5 days of rehabilitation-informed yoga, strength work, and community for people with chronic illness, autoimmune conditions, and complex bodies.",
    fullDescription: `This is not a mainstream yoga retreat. This is a carefully designed experience for people whose bodies require intelligent, evidence-based approaches to movement.

Sankalpa means "intention" in Sanskrit. This retreat is about setting intentions that honor your body's reality—building capacity, not bypassing limitations.

You'll practice rehabilitation-informed yoga, learn about strength training principles for complex bodies, connect with others who understand chronic illness, and rest in the Portuguese countryside.

This is for people who are tired of pretending their bodies are simple.`,
    dates: [
      {
        id: "1a",
        startDate: "2026-09-15",
        endDate: "2026-09-20",
        availableSpaces: 8,
        totalSpaces: 12,
      },
      {
        id: "1b",
        startDate: "2026-10-20",
        endDate: "2026-10-25",
        availableSpaces: 10,
        totalSpaces: 12,
      },
    ],
    earlyBirdPrice: 1450,
    earlyBirdDeadline: "2026-07-01",
    normalPrice: 1650,
    currency: "GBP",
    included: [
      "5 nights shared accommodation",
      "All meals (catering to dietary requirements)",
      "Daily yoga sessions (morning & evening)",
      "Strength training workshop",
      "Movement workshops for chronic conditions",
      "Pool and outdoor space access",
      "Airport transfers from Lisbon",
      "Small group size (max 12 people)",
    ],
    notIncluded: [
      "Flights to Lisbon",
      "Travel insurance (required)",
      "Personal expenses",
      "Single room supplement (£200)",
    ],
    schedule: [
      {
        day: "Day 1 - Arrival",
        activities: [
          "Airport pickup from Lisbon (afternoon)",
          "Welcome dinner and introductions",
          "Gentle evening yoga and intention setting",
        ],
      },
      {
        day: "Day 2-4 - Full Days",
        activities: [
          "Morning yoga practice (90 mins)",
          "Breakfast",
          "Workshop or strength session",
          "Lunch and free time (pool, rest, explore)",
          "Afternoon tea",
          "Evening yoga or restorative practice",
          "Dinner",
        ],
      },
      {
        day: "Day 5 - Departure",
        activities: [
          "Morning yoga practice",
          "Breakfast",
          "Closing circle and reflection",
          "Airport transfers to Lisbon",
        ],
      },
    ],
    accommodation:
      "Traditional Portuguese villa with shared twin rooms, ensuite bathrooms, pool, and gardens. Single room supplement available for £200.",
    suitableFor: [
      "People with chronic illness or autoimmune conditions",
      "Anyone with psoriatic arthritis, rheumatoid arthritis, or chronic pain",
      "People with hypermobility or long-term injuries",
      "Those frustrated by mainstream yoga approaches",
      "Anyone wanting evidence-based movement in a supportive environment",
    ],
  },
  {
    id: "2",
    title: "Strength & Stillness",
    subtitle: "Winter Retreat for Complex Bodies",
    slug: "strength-stillness-winter",
    location: "Scottish Highlands",
    imageUrl: "scottish highlands winter retreat",
    shortDescription:
      "4 days of strength training, restorative yoga, and community in the Scottish Highlands for people managing chronic conditions.",
    fullDescription: `A winter retreat designed specifically for people with complex bodies who want to build strength and find stillness.

This retreat combines evidence-based strength training principles with restorative yoga practices, all adapted for people managing chronic illness, autoimmune conditions, and chronic pain.

Set in the Scottish Highlands, you'll have space to rest, move intelligently, and connect with others who understand the reality of living with chronic conditions.

Small group (max 10 people), led by Shruti Turner with guest physiotherapist.`,
    dates: [
      {
        id: "2a",
        startDate: "2027-01-18",
        endDate: "2027-01-22",
        availableSpaces: 6,
        totalSpaces: 10,
      },
    ],
    earlyBirdPrice: 950,
    earlyBirdDeadline: "2026-11-01",
    normalPrice: 1100,
    currency: "GBP",
    included: [
      "4 nights accommodation (twin share)",
      "All meals and snacks",
      "Daily strength training sessions",
      "Restorative yoga sessions",
      "Movement workshops with guest physiotherapist",
      "Use of gym equipment and facilities",
      "Small group coaching (max 10 people)",
    ],
    notIncluded: [
      "Transport to/from venue",
      "Travel insurance (required)",
      "Personal expenses",
      "Single room supplement (£150)",
    ],
    schedule: [
      {
        day: "Day 1 - Arrival",
        activities: [
          "Arrive afternoon (self-transport)",
          "Welcome and orientation",
          "Light movement session",
          "Dinner and group introduction",
        ],
      },
      {
        day: "Day 2-3 - Full Days",
        activities: [
          "Morning strength training session (60 mins)",
          "Breakfast",
          "Workshop: Programming for complex bodies",
          "Lunch and rest time",
          "Afternoon: Restorative yoga or optional walk",
          "Evening session and reflection",
          "Dinner",
        ],
      },
      {
        day: "Day 4 - Departure",
        activities: ["Morning yoga practice", "Breakfast and closing circle", "Depart by midday"],
      },
    ],
    accommodation:
      "Comfortable Scottish lodge with twin rooms, ensuite bathrooms, communal spaces, and access to gym equipment. Single room supplement available.",
    suitableFor: [
      "People wanting to learn strength training for chronic conditions",
      "Those managing autoimmune arthritis or chronic pain",
      "Anyone looking for evidence-based approaches to building capacity",
      "People who want small group coaching and community",
      'Those ready to challenge the "just rest" narrative',
    ],
  },
  {
    id: "3",
    title: "Virtual Immersion Weekend",
    subtitle: "An Online Retreat for Bodies That Can't Travel",
    slug: "virtual-immersion",
    location: "Online (Live via Video)",
    imageUrl: "online yoga class laptop home",
    shortDescription:
      "A 2-day live online retreat bringing the retreat experience home — adaptive yoga, strength workshops, community connection, and rest, all from wherever you are.",
    fullDescription: `Not everyone can travel to a retreat. Whether it's finances, health limitations, caring responsibilities, or simply that travelling triggers your symptoms — you deserve a retreat experience too.

Virtual Immersion Weekend is a fully live, interactive 2-day online retreat that brings the depth and community of an in-person retreat into your home. This is not a set of pre-recorded videos. Every session is live, every interaction is real.

You'll move through adaptive yoga, learn strength training principles, connect with a small group who understand chronic illness, and have genuine rest built into the schedule. Shruti teaches every session with the same care and attention as the in-person retreats.

Sessions are paced with generous breaks. Camera-on is encouraged but never required. Community mode lets you see and chat with fellow participants between sessions. And the whole thing is designed for bodies that fluctuate — if you need to lie down during a session, that's not just allowed, it's anticipated.`,
    dates: [
      {
        id: "3a",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        availableSpaces: 14,
        totalSpaces: 20,
      },
      {
        id: "3b",
        startDate: "2026-11-07",
        endDate: "2026-11-08",
        availableSpaces: 20,
        totalSpaces: 20,
      },
    ],
    earlyBirdPrice: 120,
    earlyBirdDeadline: "2026-05-01",
    normalPrice: 150,
    currency: "GBP",
    included: [
      "All live sessions over 2 days (approx. 8 hours total)",
      "Adaptive yoga sessions (morning & afternoon)",
      "Strength training workshop",
      "Community connection sessions with chat",
      "Digital welcome pack with schedule & equipment list",
      "7-day replay access to all sessions",
      "Small group size (max 20 people)",
      "Printable movement guides to keep",
    ],
    notIncluded: [
      "Physical equipment (list provided in advance)",
      "Food & drink (suggested snack/meal ideas provided)",
    ],
    schedule: [
      {
        day: "Day 1 - Saturday",
        activities: [
          "10:00 - Welcome circle and introductions (camera on encouraged)",
          "10:30 - Adaptive Yoga Flow (60 mins)",
          "11:45 - Break (15 mins)",
          "12:00 - Strength Workshop: Foundations for Complex Bodies (45 mins)",
          "12:45 - Lunch break (90 mins — rest, eat, be human)",
          "14:15 - Movement exploration: Find what works for your body (45 mins)",
          "15:00 - Community tea & chat (camera on, informal)",
          "15:30 - Restorative Yoga (45 mins)",
          "16:15 - Close & evening intention setting",
        ],
      },
      {
        day: "Day 2 - Sunday",
        activities: [
          "10:00 - Morning check-in & gentle movement (30 mins)",
          "10:30 - Yoga for Nervous System Regulation (60 mins)",
          "11:45 - Break (15 mins)",
          "12:00 - Strength Workshop: Building Your Own Practice (45 mins)",
          "12:45 - Lunch break (75 mins)",
          "14:00 - Community Q&A with Shruti (45 mins)",
          "14:45 - Final restorative practice (30 mins)",
          "15:15 - Closing circle, reflections & next steps",
        ],
      },
    ],
    accommodation:
      "Your own home. We recommend setting up a comfortable space with your yoga mat, a chair, and any props you have. A printable setup guide is included in your welcome pack.",
    suitableFor: [
      "People who can't travel to in-person retreats",
      "Anyone managing chronic illness, autoimmune conditions, or chronic pain",
      "Those wanting a structured weekend of movement and rest",
      "People curious about retreats but not ready for the in-person commitment",
      "Anyone who benefits from exercising in their own familiar space",
      "Carers or parents who need to stay close to home",
    ],
  },
];

export function getRetreatBySlug(slug: string): Retreat | undefined {
  return retreats.find((retreat) => retreat.slug === slug);
}

export function getRetreatById(id: string): Retreat | undefined {
  return retreats.find((retreat) => retreat.id === id);
}

export function getUpcomingRetreats(): Retreat[] {
  const now = new Date();
  return retreats.filter((retreat) => retreat.dates.some((date) => new Date(date.startDate) > now));
}
