import type { RetreatRoomOptionContent } from "@/lib/content/types";

export type RetreatDeliveryMode = "in_person" | "online_live";
export type RetreatExperienceType = "residential_retreat" | "online_workshop";
export type RetreatBookingUnit = "bed_space" | "whole_room" | "online_live_place";
export type RetreatInventoryType = "bed_space" | "room" | "online_live_place";
export type RetreatDepositType = "percentage" | "fixed_amount" | "full_payment";

export interface RetreatRatePlanSeed {
  guestCount: number;
  totalPricePence: number;
  earlyBirdPricePence?: number;
  earlyBirdEndsAt?: string;
}

export interface RetreatRoomOptionSeed extends RetreatRoomOptionContent {
  slug: string;
  bookingUnit: RetreatBookingUnit;
  inventoryType: RetreatInventoryType;
  inventoryQuantity: number;
  guestCountPerUnit?: number;
  physicalRoomCount?: number;
  bedsPerPhysicalRoom?: number;
  allowedGuestCounts?: number[];
  ratePlans: RetreatRatePlanSeed[];
  displayOrder?: number;
}

export interface RetreatScheduleItemSeed {
  startTime: string;
  endTime?: string;
  title: string;
  description?: string;
  category:
    | "yoga"
    | "movement"
    | "meditation"
    | "breathwork"
    | "food"
    | "outdoors"
    | "workshop"
    | "free_time"
    | "arrival"
    | "departure"
    | "other";
  isOptional?: boolean;
}

export interface RetreatDate {
  id: string;
  startDate: string;
  endDate: string;
  startDateTime?: string;
  endDateTime?: string;
  retreatType: "in_person" | "online";
  availableSpaces: number;
  totalSpaces: number;
  roomOptions: RetreatRoomOptionSeed[];
  depositType: RetreatDepositType;
  depositPercentageBasisPoints?: number;
  fixedDepositAmountPence?: number;
  balanceDueDaysBeforeStart?: number;
  replayAccessDurationDays?: number;
  isRecorded?: boolean;
  payInFullDiscountEnabled?: boolean;
}

export interface RetreatVenueSeed {
  slug: string;
  name: string;
  displayLocation: string;
  description: string;
  address: string;
  accommodationOptions: string[];
  travelInformation: string;
  accommodationType: string;
  facilities: string[];
  accessibilityNotes: string;
  addressLine1?: string;
  addressLine2?: string;
  townOrCity?: string;
  region?: string;
  postcode?: string;
  country?: string;
  arrivalInformation?: string;
  travelByTrain?: string;
  travelByCar?: string;
  travelByAir?: string;
  localTransferInformation?: string;
  kitchenAccessDescription?: string;
}

export interface Retreat {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  experienceType: RetreatExperienceType;
  deliveryMode: RetreatDeliveryMode;
  durationLabel: string;
  audienceDescription: string;
  experienceLevel: string;
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
    title: string;
    activities: string[];
    items: RetreatScheduleItemSeed[];
  }[];
  accommodation: string;
  suitableFor: string[];
  foodAndDrinkDescription: string;
  whatToBring?: string[];
  venue: RetreatVenueSeed;
}

function roomOption(input: RetreatRoomOptionSeed): RetreatRoomOptionSeed {
  return input;
}

const onlineVenue: RetreatVenueSeed = {
  slug: "online",
  name: "Online",
  displayLocation: "Online (live through this website)",
  description: "Live online delivery through the Shruti Turner website.",
  address: "Online",
  accommodationOptions: ["Live online access"],
  travelInformation: "No travel required. Join from a quiet space with a reliable connection.",
  accommodationType: "Online live workshop",
  facilities: ["Live stream"],
  accessibilityNotes:
    "Contact Shruti before booking if there is anything that would make the online session easier to access.",
  country: "Online",
  arrivalInformation:
    "Sign in to the website before the live-access window opens and join from your retreat dashboard.",
};

export const retreats: Retreat[] = [
  {
    id: "the-middle-ground",
    title: "The Middle Ground",
    subtitle: "Movement, motivation and working with your body this autumn",
    slug: "the-middle-ground",
    experienceType: "online_workshop",
    deliveryMode: "online_live",
    durationLabel: "2.5-hour online workshop",
    audienceDescription:
      "For people who want to understand and adapt their movement as routines, energy and bodies change with the season.",
    experienceLevel: "All levels",
    location: "Online",
    imageUrl: "/images/shruti-hiking-selfie.jpeg",
    shortDescription:
      "A morning exploring how to work with your body as autumn arrives, combining gentle movement, practical science, reflection, meditation and playful exploration.",
    fullDescription: `You don't need to start again every September.

The seasons change. Your routines change. Your energy changes. Your body changes. That doesn't mean you've failed.

The Middle Ground is a morning exploring how to work with your body as autumn arrives.

Through gentle movement, practical science, reflection and journalling, meditation and playful exploration, we will look at how you can adapt movement without losing direction.

You'll leave with more confidence adapting your movement, a better understanding of your body's signals, practical tools for changing seasons and your own version of “the middle ground”.`,
    dates: [
      {
        id: "the-middle-ground-2026-10-04",
        startDate: "2026-10-04",
        endDate: "2026-10-04",
        startDateTime: "2026-10-04T09:30:00.000+01:00",
        endDateTime: "2026-10-04T12:00:00.000+01:00",
        retreatType: "online",
        availableSpaces: 30,
        totalSpaces: 30,
        depositType: "full_payment",
        fixedDepositAmountPence: 3500,
        payInFullDiscountEnabled: false,
        isRecorded: false,
        roomOptions: [
          roomOption({
            id: "live-workshop-ticket",
            slug: "live-workshop-ticket",
            label: "Live Workshop Ticket",
            description: "One live online place for The Middle Ground.",
            type: "virtual",
            bookingUnit: "online_live_place",
            inventoryType: "online_live_place",
            inventoryQuantity: 30,
            guestsIncluded: 1,
            guestCountPerUnit: 1,
            capacity: 30,
            availableSpots: 30,
            normalPricePence: 3500,
            depositPence: 3500,
            ratePlans: [{ guestCount: 1, totalPricePence: 3500 }],
            displayOrder: 1,
          }),
        ],
      },
    ],
    earlyBirdPrice: 35,
    earlyBirdDeadline: "2026-10-04T08:30:00.000Z",
    normalPrice: 35,
    currency: "GBP",
    included: [
      "Gentle movement",
      "Practical science",
      "Reflection and journalling",
      "Meditation",
      "Playful exploration",
    ],
    notIncluded: [],
    schedule: [
      {
        day: "Sunday 4 October",
        title: "The Middle Ground",
        activities: [
          "09:30-09:45 Welcome and settling in",
          "09:45-10:20 Gentle movement",
          "10:20-10:50 Practical science",
          "10:50-11:15 Reflection and journalling",
          "11:15-11:40 Meditation",
          "11:40-12:00 Playful exploration and closing",
        ],
        items: [
          {
            startTime: "09:30",
            endTime: "09:45",
            title: "Welcome and settling in",
            category: "arrival",
          },
          {
            startTime: "09:45",
            endTime: "10:20",
            title: "Gentle movement",
            category: "movement",
          },
          {
            startTime: "10:20",
            endTime: "10:50",
            title: "Practical science",
            category: "workshop",
          },
          {
            startTime: "10:50",
            endTime: "11:15",
            title: "Reflection and journalling",
            category: "workshop",
          },
          {
            startTime: "11:15",
            endTime: "11:40",
            title: "Meditation",
            category: "meditation",
          },
          {
            startTime: "11:40",
            endTime: "12:00",
            title: "Playful exploration and closing",
            category: "movement",
          },
        ],
      },
    ],
    accommodation: "",
    suitableFor: [
      "Adults of all genders",
      "People at any level of movement experience",
      "People whose routines, energy or bodies change with the seasons",
    ],
    foodAndDrinkDescription: "",
    whatToBring: ["Comfortable clothes", "Space to move in", "A notebook or journal", "A pen"],
    venue: onlineVenue,
  },
];
