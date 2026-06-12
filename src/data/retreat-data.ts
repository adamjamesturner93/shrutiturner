import type { RetreatRoomOptionContent } from "@/lib/content/types";

export interface RetreatDate {
  id: string;
  startDate: string;
  endDate: string;
  availableSpaces: number;
  totalSpaces: number;
  roomOptions: RetreatRoomOptionContent[];
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

function roomOption(input: RetreatRoomOptionContent): RetreatRoomOptionContent {
  return input;
}

export const retreats: Retreat[] = [
  {
    id: "1",
    title: "Sankalpa",
    subtitle: "A Yoga Retreat for Inclusive Movement and Recovery",
    slug: "sankalpa",
    location: "Portuguese Countryside",
    imageUrl: "yoga retreat portugal countryside",
    shortDescription:
      "Five days of rehabilitation-informed yoga, strength work and community for people with chronic illness, autoimmune conditions and injury recovery needs.",
    fullDescription: `This is not a mainstream yoga retreat. This is a carefully designed experience for people whose bodies require intelligent, evidence-based approaches to movement.

Sankalpa means "intention" in Sanskrit. This retreat is about setting intentions that honour your body's reality, building capacity without bypassing limitations and learning in a space where fluctuating symptoms are expected rather than awkward.

You'll practise rehabilitation-informed yoga, learn about strength training principles for chronic illness, autoimmune conditions and injury recovery, connect with others who understand chronic illness and rest in the Portuguese countryside.

This is for people who are tired of pretending their bodies are simple.`,
    dates: [
      {
        id: "1a",
        startDate: "2026-09-15",
        endDate: "2026-09-20",
        availableSpaces: 8,
        totalSpaces: 12,
        roomOptions: [
          roomOption({
            id: "1a-shared-twin",
            label: "Shared Twin",
            description:
              "Twin-share accommodation with ensuite bathroom. Ideal if you are happy to share.",
            type: "shared_twin",
            guestsIncluded: 1,
            capacity: 8,
            availableSpots: 6,
            earlyBirdPricePence: 145000,
            normalPricePence: 165000,
            depositPence: 30000,
          }),
          roomOption({
            id: "1a-single-room",
            label: "Single Room",
            description: "A private room for one person for the full retreat stay.",
            type: "single",
            guestsIncluded: 1,
            capacity: 2,
            availableSpots: 1,
            earlyBirdPricePence: 165000,
            normalPricePence: 185000,
            depositPence: 30000,
          }),
          roomOption({
            id: "1a-private-double",
            label: "Private Double for Two",
            description: "Private double room reserved for you and one guest.",
            type: "shared_private",
            guestsIncluded: 2,
            capacity: 2,
            availableSpots: 1,
            earlyBirdPricePence: 280000,
            normalPricePence: 320000,
            depositPence: 60000,
          }),
        ],
      },
      {
        id: "1b",
        startDate: "2026-10-20",
        endDate: "2026-10-25",
        availableSpaces: 10,
        totalSpaces: 12,
        roomOptions: [
          roomOption({
            id: "1b-shared-twin",
            label: "Shared Twin",
            description:
              "Twin-share accommodation with ensuite bathroom. Ideal if you are happy to share.",
            type: "shared_twin",
            guestsIncluded: 1,
            capacity: 8,
            availableSpots: 8,
            earlyBirdPricePence: 145000,
            normalPricePence: 165000,
            depositPence: 30000,
          }),
          roomOption({
            id: "1b-single-room",
            label: "Single Room",
            description: "A private room for one person for the full retreat stay.",
            type: "single",
            guestsIncluded: 1,
            capacity: 2,
            availableSpots: 1,
            earlyBirdPricePence: 165000,
            normalPricePence: 185000,
            depositPence: 30000,
          }),
          roomOption({
            id: "1b-private-double",
            label: "Private Double for Two",
            description: "Private double room reserved for you and one guest.",
            type: "shared_private",
            guestsIncluded: 2,
            capacity: 2,
            availableSpots: 1,
            earlyBirdPricePence: 280000,
            normalPricePence: 320000,
            depositPence: 60000,
          }),
        ],
      },
    ],
    earlyBirdPrice: 1450,
    earlyBirdDeadline: "2026-07-01",
    normalPrice: 1650,
    currency: "GBP",
    included: [
      "Five nights shared accommodation",
      "All meals, tailored to dietary requirements",
      "Daily yoga sessions (morning and evening)",
      "Strength workshop for chronic illness, autoimmune conditions and injury recovery",
      "Movement workshops and education",
      "Pool and outdoor space access",
      "Airport transfers from Lisbon",
      "Small group size (max 12 people)",
    ],
    notIncluded: [
      "Flights to Lisbon",
      "Travel insurance (required)",
      "Personal expenses",
      "Optional private room upgrade",
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
      "A traditional Portuguese villa with shared twin rooms, a small number of private rooms and one private double option for two guests. Ensuite bathrooms, pool and calm outdoor space included.",
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
    subtitle: "Winter Retreat for Inclusive Movement and Recovery",
    slug: "strength-stillness-winter",
    location: "Scottish Highlands",
    imageUrl: "scottish highlands winter retreat",
    shortDescription:
      "Four days of strength training, restorative yoga and community in the Scottish Highlands for people managing chronic conditions.",
    fullDescription: `A winter retreat designed for people living with chronic illness, autoimmune conditions, or injury recovery who want to build strength and find stillness.

This retreat combines evidence-based strength training principles with restorative yoga practices, all adapted for people managing chronic illness, autoimmune conditions and chronic pain.

Set in the Scottish Highlands, you'll have space to rest, move intelligently and connect with others who understand the reality of living with chronic conditions.

Small group, led by Shruti Turner with a guest physiotherapist.`,
    dates: [
      {
        id: "2a",
        startDate: "2027-01-18",
        endDate: "2027-01-22",
        availableSpaces: 6,
        totalSpaces: 10,
        roomOptions: [
          roomOption({
            id: "2a-shared-twin",
            label: "Twin Share",
            description: "Twin-share room with ensuite bathroom.",
            type: "shared_twin",
            guestsIncluded: 1,
            capacity: 8,
            availableSpots: 5,
            earlyBirdPricePence: 95000,
            normalPricePence: 110000,
            depositPence: 25000,
          }),
          roomOption({
            id: "2a-single-room",
            label: "Single Room",
            description: "Private room with more space for rest and decompression.",
            type: "single",
            guestsIncluded: 1,
            capacity: 2,
            availableSpots: 1,
            earlyBirdPricePence: 110000,
            normalPricePence: 125000,
            depositPence: 30000,
          }),
        ],
      },
    ],
    earlyBirdPrice: 950,
    earlyBirdDeadline: "2026-11-01",
    normalPrice: 1100,
    currency: "GBP",
    included: [
      "Four nights accommodation (twin share)",
      "All meals and snacks",
      "Daily strength training sessions",
      "Restorative yoga sessions",
      "Movement workshops with guest physiotherapist",
      "Use of gym equipment and facilities",
      "Small group coaching",
    ],
    notIncluded: [
      "Transport to and from the venue",
      "Travel insurance (required)",
      "Personal expenses",
      "Optional private room upgrade",
    ],
    schedule: [
      {
        day: "Day 1 - Arrival",
        activities: [
          "Arrive in the afternoon",
          "Welcome and orientation",
          "Light movement session",
          "Dinner and group introduction",
        ],
      },
      {
        day: "Day 2-3 - Full Days",
        activities: [
          "Morning strength training session",
          "Breakfast",
          "Workshop: programming for chronic illness, autoimmune conditions and injury recovery",
          "Lunch and rest time",
          "Afternoon restorative yoga or optional walk",
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
      "A comfortable lodge with twin rooms, a small number of private rooms, communal spaces and easy access to equipment and outdoor rest areas.",
    suitableFor: [
      "People wanting to learn strength training for chronic conditions",
      "Those managing autoimmune arthritis or chronic pain",
      "Anyone looking for evidence-based approaches to building capacity",
      "People who want small group coaching and community",
      "Those ready to challenge the 'just rest' narrative",
    ],
  },
  {
    id: "3",
    title: "Virtual Immersion Weekend",
    subtitle: "An Online Retreat for People Who Cannot Travel",
    slug: "virtual-immersion",
    location: "Online (Live via Video)",
    imageUrl: "online yoga class laptop home",
    shortDescription:
      "A two-day live online retreat bringing the retreat experience home — adaptive yoga, strength workshops, community connection and rest.",
    fullDescription: `Not everyone can travel to a retreat. Whether it's finances, health limitations, caring responsibilities, or simply that travelling triggers your symptoms, you deserve a retreat experience too.

Virtual Immersion Weekend is a fully live, interactive two-day online retreat that brings the depth and community of an in-person retreat into your home. This is not a set of pre-recorded videos. Every session is live, every interaction is real.

You'll move through adaptive yoga, learn strength training principles, connect with a small group who understand chronic illness and have genuine rest built into the schedule.`,
    dates: [
      {
        id: "3a",
        startDate: "2026-06-13",
        endDate: "2026-06-14",
        availableSpaces: 14,
        totalSpaces: 20,
        roomOptions: [
          roomOption({
            id: "3a-online-pass",
            label: "Virtual Retreat Pass",
            description: "Live online access for one person, including the full weekend.",
            type: "virtual",
            guestsIncluded: 1,
            capacity: 20,
            availableSpots: 14,
            earlyBirdPricePence: 12000,
            normalPricePence: 15000,
            depositPence: 12000,
          }),
        ],
      },
      {
        id: "3b",
        startDate: "2026-11-07",
        endDate: "2026-11-08",
        availableSpaces: 20,
        totalSpaces: 20,
        roomOptions: [
          roomOption({
            id: "3b-online-pass",
            label: "Virtual Retreat Pass",
            description: "Live online access for one person, including the full weekend.",
            type: "virtual",
            guestsIncluded: 1,
            capacity: 20,
            availableSpots: 20,
            earlyBirdPricePence: 12000,
            normalPricePence: 15000,
            depositPence: 12000,
          }),
        ],
      },
    ],
    earlyBirdPrice: 120,
    earlyBirdDeadline: "2026-05-01",
    normalPrice: 150,
    currency: "GBP",
    included: [
      "All live sessions over two days",
      "Adaptive yoga sessions",
      "Strength training workshop",
      "Community connection sessions",
      "Digital welcome pack with schedule and equipment list",
      "Live access to every included session",
      "Printable movement guides to keep",
    ],
    notIncluded: ["Physical equipment (list provided in advance)", "Food and drink"],
    schedule: [
      {
        day: "Day 1 - Saturday",
        activities: [
          "10:00 Welcome circle and introductions",
          "10:30 Adaptive Yoga Flow",
          "12:00 Strength workshop: foundations for chronic illness, autoimmune conditions and injury recovery",
          "14:15 Movement exploration",
          "15:30 Restorative yoga",
        ],
      },
      {
        day: "Day 2 - Sunday",
        activities: [
          "10:00 Morning check-in and gentle movement",
          "10:30 Yoga for nervous system regulation",
          "12:00 Strength workshop: building your own practice",
          "14:00 Community Q&A",
          "14:45 Final restorative practice",
        ],
      },
    ],
    accommodation:
      "Your own home. A printable setup guide is included so you can create a calmer space with props, a chairand whatever support you already have.",
    suitableFor: [
      "People who cannot travel to in-person retreats",
      "Anyone managing chronic illness, autoimmune conditions, or chronic pain",
      "Those wanting a structured weekend of movement and rest",
      "People curious about retreats but not ready for the in-person commitment",
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
