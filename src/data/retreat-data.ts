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

const powisHouseVenue: RetreatVenueSeed = {
  slug: "powis-house-estate",
  name: "Powis House Estate",
  displayLocation: "Near Stirling, Scotland",
  description:
    "A historic countryside estate close to Stirling, with gardens and woodland, indoor and outdoor spaces for practice and comfortable self-catering accommodation. The retreat makes use of the estate as a place to gather, practise and rest, while remaining accessible from central Scotland.",
  address: "Powis House Estate\nNear Stirling\nScotland",
  accommodationOptions: [
    "Shared twin bed spaces",
    "Private king rooms for one or two guests",
    "Self-catering accommodation with kitchen access",
  ],
  travelInformation:
    "Stirling is the recommended railway arrival point. Powis House Estate is approximately 10 minutes from Stirling station by road. Guests can coordinate shared taxis and lifts from Stirling station where possible. The venue is well placed for travel from central Scotland, including Glasgow and Edinburgh.",
  accommodationType: "Historic countryside estate with self-catering accommodation",
  facilities: [
    "Gardens and woodland",
    "Indoor and outdoor practice spaces",
    "Kitchen access for drinks and simple snacks",
  ],
  accessibilityNotes: "Contact Shruti before booking to discuss access needs for this venue.",
  addressLine1: "Powis House Estate",
  region: "Near Stirling",
  country: "Scotland",
  arrivalInformation: "Arrival and check-in are between 16:00 and 18:00 on Friday.",
  travelByTrain:
    "Stirling is the recommended railway arrival point. Powis House Estate is approximately 10 minutes from Stirling station by road.",
  travelByCar:
    "The venue is well placed for travel from central Scotland, including Glasgow and Edinburgh.",
  localTransferInformation:
    "Guests can coordinate shared taxis and lifts from Stirling station where possible.",
  kitchenAccessDescription:
    "The kitchen is available throughout the retreat for making drinks and simple snacks between meals.",
};

const ballintaggartVenue: RetreatVenueSeed = {
  slug: "ballintaggart-farm",
  name: "Ballintaggart Farm",
  displayLocation: "Grandtully / Balnaguard area, Highland Perthshire, Scotland",
  description:
    "Ballintaggart Farm is a rural Highland Perthshire base near Grandtully, surrounded by countryside and within easy reach of both Pitlochry and Aberfeldy.",
  address: "Ballintaggart Farm\nGrandtully\nPitlochry\nPH9 0PX\nScotland",
  accommodationOptions: [
    "Private ensuite rooms",
    "King room for two guests booking together",
    "Shared twin bed spaces",
  ],
  travelInformation:
    "Pitlochry is the recommended railway arrival point. Guests travelling by public transport should travel to Pitlochry and use the retreat's configured local transfer information. Local transfer type for this seed: shared taxi coordination available.",
  accommodationType: "Rural self-catering accommodation with a strong food focus",
  facilities: [
    "Countryside setting",
    "Outdoor space",
    "Sauna access",
    "Self-catering accommodation",
    "Proximity to walking and outdoor activities",
  ],
  accessibilityNotes: "Contact Shruti before booking to discuss access needs for this venue.",
  addressLine1: "Ballintaggart Farm",
  townOrCity: "Grandtully",
  region: "Pitlochry",
  postcode: "PH9 0PX",
  country: "Scotland",
  arrivalInformation:
    "Guests travelling by public transport should travel to Pitlochry and use the configured local transfer information.",
  travelByTrain: "Pitlochry is the recommended railway arrival point.",
  localTransferInformation: "Shared taxi coordination is available for this sample retreat.",
};

const onlineVenue: RetreatVenueSeed = {
  slug: "online",
  name: "Online",
  displayLocation: "Online (live through this website)",
  description: "Live online delivery through the Shruti Turner website.",
  address: "Online",
  accommodationOptions: ["Live online access"],
  travelInformation: "No travel required. Join from a quiet space with a reliable connection.",
  accommodationType: "Online live workshop",
  facilities: ["Live stream", "Replay access when published"],
  accessibilityNotes:
    "Contact Shruti before booking if there is anything that would make the online session easier to access.",
  country: "Online",
  arrivalInformation:
    "Sign in to the website before the live-access window opens and join from your retreat dashboard.",
};

export const retreats: Retreat[] = [
  {
    id: "pause-move-breathe-stirling",
    title: "Pause, Move, Breathe: A Yoga Weekend in Stirling",
    subtitle: "A relaxed weekend of yoga, movement, good food and space to slow down",
    slug: "pause-move-breathe-stirling",
    experienceType: "residential_retreat",
    deliveryMode: "in_person",
    durationLabel: "3 days / 2 nights",
    audienceDescription:
      "Adults of all genders. Suitable for a range of yoga experience, including people who are relatively new to yoga.",
    experienceLevel: "All levels",
    location: "Near Stirling, Scotland",
    imageUrl: "/images/shruti-coaching.jpeg",
    shortDescription:
      "A relaxed weekend of yoga, movement, good food, fresh air and proper time to slow down. This is not a packed schedule or a weekend of trying to become a new person. The retreat is designed to give you space to move, rest, spend time outdoors and reconnect with the things that help you feel more like yourself.",
    fullDescription: `Join Shruti for a small, relaxed weekend in the Scottish countryside, with yoga, movement, good food and enough free time to genuinely enjoy being away.

Across the weekend we will practise in different ways. Some sessions will be energising and playful, with elements of strength, balance and mobility. Others will be slower and quieter.

There will be time outside, time to eat together and plenty of time that has deliberately not been filled with activities.

You can come on your own, with a friend or with a partner. The retreat is open to adults of all genders and is suitable for different levels of yoga experience.

Nothing on the schedule is compulsory. This is your weekend too.`,
    dates: [
      {
        id: "pause-move-breathe-stirling-2026-09-18",
        startDate: "2026-09-18",
        endDate: "2026-09-20",
        startDateTime: "2026-09-18T16:00:00.000+01:00",
        endDateTime: "2026-09-20T14:00:00.000+01:00",
        retreatType: "in_person",
        availableSpaces: 10,
        totalSpaces: 10,
        depositType: "percentage",
        depositPercentageBasisPoints: 2000,
        balanceDueDaysBeforeStart: 56,
        roomOptions: [
          roomOption({
            id: "shared-twin-bed",
            slug: "shared-twin-bed",
            label: "Shared Twin Bed",
            description: "One bed in a twin room shared with one other retreat guest.",
            type: "shared_twin",
            bookingUnit: "bed_space",
            inventoryType: "bed_space",
            inventoryQuantity: 6,
            guestsIncluded: 1,
            guestCountPerUnit: 1,
            physicalRoomCount: 3,
            bedsPerPhysicalRoom: 2,
            capacity: 6,
            availableSpots: 6,
            normalPricePence: 42500,
            depositPence: 8500,
            ratePlans: [
              {
                guestCount: 1,
                totalPricePence: 42500,
                earlyBirdPricePence: 39500,
                earlyBirdEndsAt: "2026-08-14T22:59:59.000Z",
              },
            ],
            displayOrder: 1,
          }),
          roomOption({
            id: "private-king-room",
            slug: "private-king-room",
            label: "Private King Room",
            description: "A private king room for one or two guests.",
            type: "shared_private",
            bookingUnit: "whole_room",
            inventoryType: "room",
            inventoryQuantity: 2,
            guestsIncluded: 1,
            capacity: 2,
            availableSpots: 2,
            roomCount: 2,
            normalPricePence: 52500,
            depositPence: 10500,
            allowedGuestCounts: [1, 2],
            ratePlans: [
              {
                guestCount: 1,
                totalPricePence: 52500,
                earlyBirdPricePence: 49500,
                earlyBirdEndsAt: "2026-08-14T22:59:59.000Z",
              },
              {
                guestCount: 2,
                totalPricePence: 91000,
                earlyBirdPricePence: 86000,
                earlyBirdEndsAt: "2026-08-14T22:59:59.000Z",
              },
            ],
            displayOrder: 2,
          }),
        ],
      },
    ],
    earlyBirdPrice: 395,
    earlyBirdDeadline: "2026-08-14T22:59:59.000Z",
    normalPrice: 425,
    currency: "GBP",
    included: [
      "two nights' accommodation",
      "all scheduled yoga and movement sessions",
      "slower practices and guided relaxation sessions",
      "brunch and dinner as scheduled",
      "tea and basic refreshment provision",
      "use of the kitchen for making simple snacks",
      "use of agreed retreat spaces and grounds",
    ],
    notIncluded: [
      "travel to and from the retreat",
      "travel insurance",
      "personal purchases",
      "optional external activities not explicitly listed as included",
    ],
    schedule: [
      {
        day: "Day 1",
        title: "Arrive and Exhale",
        activities: [
          "16:00-18:00 Arrival and check-in",
          "18:00-19:00 Welcome and grounding practice",
          "19:30 Dinner",
          "21:00-21:30 Optional guided relaxation",
        ],
        items: [
          {
            startTime: "16:00",
            endTime: "18:00",
            title: "Arrival and check-in",
            category: "arrival",
          },
          {
            startTime: "18:00",
            endTime: "19:00",
            title: "Welcome and grounding practice",
            category: "yoga",
          },
          { startTime: "19:30", title: "Dinner", category: "food" },
          {
            startTime: "21:00",
            endTime: "21:30",
            title: "Optional guided relaxation",
            category: "meditation",
            isOptional: true,
          },
        ],
      },
      {
        day: "Day 2",
        title: "Move, Explore and Restore",
        activities: [
          "08:00-09:30 Morning yoga practice",
          "10:00 Brunch",
          "11:30-13:30 Outdoor time or local walk",
          "13:30-16:00 Free time",
          "16:00-17:30 Movement workshop",
          "19:00 Dinner",
          "21:00 Optional slow practice or meditation",
        ],
        items: [
          {
            startTime: "08:00",
            endTime: "09:30",
            title: "Morning yoga practice",
            description:
              "A progressive practice combining mobility, strength, balance and flowing movement, with options offered throughout.",
            category: "yoga",
          },
          { startTime: "10:00", title: "Brunch", category: "food" },
          {
            startTime: "11:30",
            endTime: "13:30",
            title: "Outdoor time or local walk",
            category: "outdoors",
          },
          { startTime: "13:30", endTime: "16:00", title: "Free time", category: "free_time" },
          {
            startTime: "16:00",
            endTime: "17:30",
            title: "Movement workshop",
            description:
              "An exploratory session based around a theme such as balance, strength, mobility or inversions, adapted to the group.",
            category: "workshop",
          },
          { startTime: "19:00", title: "Dinner", category: "food" },
          {
            startTime: "21:00",
            title: "Optional slow practice or meditation",
            category: "meditation",
            isOptional: true,
          },
        ],
      },
      {
        day: "Day 3",
        title: "Reflect and Return",
        activities: [
          "08:00-09:15 Slow flow and breathwork",
          "10:00 Brunch",
          "11:30-12:45 Closing workshop and reflective practice",
          "13:00-14:00 Closing circle and departures",
        ],
        items: [
          {
            startTime: "08:00",
            endTime: "09:15",
            title: "Slow flow and breathwork",
            category: "breathwork",
          },
          { startTime: "10:00", title: "Brunch", category: "food" },
          {
            startTime: "11:30",
            endTime: "12:45",
            title: "Closing workshop and reflective practice",
            category: "workshop",
          },
          {
            startTime: "13:00",
            endTime: "14:00",
            title: "Closing circle and departures",
            category: "departure",
          },
        ],
      },
    ],
    accommodation:
      "Shared twin bed spaces and private king rooms at Powis House Estate. One shared twin booking reserves one bed space, not a whole twin room.",
    suitableFor: [
      "Adults of all genders",
      "People with a range of yoga experience",
      "People who are relatively new to yoga",
      "People who want movement, rest and time outdoors without a packed schedule",
    ],
    foodAndDrinkDescription:
      "Brunch and dinner are included. The kitchen is also available to guests throughout the retreat for making drinks and simple snacks between meals.",
    venue: powisHouseVenue,
  },
  {
    id: "wild-ground-highland-perthshire",
    title: "Wild Ground: Yoga, Walking and Rest in Highland Perthshire",
    subtitle: "Three nights with yoga, walks, good food and enough time to switch off",
    slug: "wild-ground-highland-perthshire",
    experienceType: "residential_retreat",
    deliveryMode: "in_person",
    durationLabel: "4 days / 3 nights",
    audienceDescription:
      "Adults of all genders who enjoy movement and time outdoors, with options to adapt or rest.",
    experienceLevel: "All levels",
    location: "Grandtully / Balnaguard area, Highland Perthshire, Scotland",
    imageUrl: "/images/shruti.jpeg",
    shortDescription:
      "Three nights in Highland Perthshire with yoga, walks, good food and plenty of time to switch off. Wild Ground is for people who enjoy moving their bodies but do not want every minute of a retreat scheduled for them.",
    fullDescription: `Wild Ground is a slightly more active retreat built around movement, time outdoors, food and rest.

Mornings begin with yoga. Some practices will flow; some will focus more closely on strength, mobility and balance. During the day there will be time to explore the landscape on foot, alongside genuinely unstructured time back at the venue.

Evenings slow down.

There is no pressure to attend every session. Take the longer walk or choose the shorter option. Join the slower evening practice or have an early night. Read, talk, nap or sit outside for a while.

The point is not to fit as much as possible into four days away. It is to move, eat well, spend time outside and return home feeling rested rather than needing a holiday from your retreat.

Open to adults of all genders.`,
    dates: [
      {
        id: "wild-ground-highland-perthshire-2026-10-22",
        startDate: "2026-10-22",
        endDate: "2026-10-25",
        startDateTime: "2026-10-22T15:00:00.000+01:00",
        endDateTime: "2026-10-25T14:00:00.000+00:00",
        retreatType: "in_person",
        availableSpaces: 10,
        totalSpaces: 10,
        depositType: "percentage",
        depositPercentageBasisPoints: 2500,
        balanceDueDaysBeforeStart: 70,
        roomOptions: [
          roomOption({
            id: "private-ensuite-room",
            slug: "private-ensuite-room",
            label: "Private Ensuite Room",
            description: "A private ensuite room for one retreat guest.",
            type: "single",
            bookingUnit: "whole_room",
            inventoryType: "room",
            inventoryQuantity: 4,
            guestsIncluded: 1,
            capacity: 4,
            availableSpots: 4,
            roomCount: 4,
            normalPricePence: 72500,
            depositPence: 18125,
            allowedGuestCounts: [1],
            ratePlans: [
              {
                guestCount: 1,
                totalPricePence: 72500,
                earlyBirdPricePence: 68500,
                earlyBirdEndsAt: "2026-09-04T22:59:59.000Z",
              },
            ],
            displayOrder: 1,
          }),
          roomOption({
            id: "king-room-for-two",
            slug: "king-room-for-two",
            label: "King Room for Two",
            description: "A private king room for two retreat guests booking together.",
            type: "shared_private",
            bookingUnit: "whole_room",
            inventoryType: "room",
            inventoryQuantity: 1,
            guestsIncluded: 2,
            capacity: 1,
            availableSpots: 1,
            roomCount: 1,
            normalPricePence: 115000,
            depositPence: 28750,
            allowedGuestCounts: [2],
            ratePlans: [
              {
                guestCount: 2,
                totalPricePence: 115000,
                earlyBirdPricePence: 109500,
                earlyBirdEndsAt: "2026-09-04T22:59:59.000Z",
              },
            ],
            displayOrder: 2,
          }),
          roomOption({
            id: "shared-twin-bed",
            slug: "shared-twin-bed",
            label: "Shared Twin Bed",
            description: "One bed in a twin room shared with one other retreat guest.",
            type: "shared_twin",
            bookingUnit: "bed_space",
            inventoryType: "bed_space",
            inventoryQuantity: 4,
            guestsIncluded: 1,
            guestCountPerUnit: 1,
            physicalRoomCount: 2,
            bedsPerPhysicalRoom: 2,
            capacity: 4,
            availableSpots: 4,
            normalPricePence: 62500,
            depositPence: 15625,
            ratePlans: [
              {
                guestCount: 1,
                totalPricePence: 62500,
                earlyBirdPricePence: 59000,
                earlyBirdEndsAt: "2026-09-04T22:59:59.000Z",
              },
            ],
            displayOrder: 3,
          }),
        ],
      },
    ],
    earlyBirdPrice: 590,
    earlyBirdDeadline: "2026-09-04T22:59:59.000Z",
    normalPrice: 625,
    currency: "GBP",
    included: [
      "three nights' accommodation",
      "all scheduled yoga and movement sessions",
      "guided walks or organised outdoor sessions",
      "meals as listed",
      "retreat workshops",
      "slower evening practices",
      "one group sauna session",
    ],
    notIncluded: [
      "travel to and from the venue",
      "travel insurance",
      "personal purchases",
      "optional treatments or activities not explicitly included",
    ],
    schedule: [
      {
        day: "Day 1",
        title: "Land",
        activities: [
          "15:00-17:00 Arrival and settle in",
          "17:30 Welcome and mobility practice",
          "19:00 Dinner",
          "21:00 Optional guided relaxation",
        ],
        items: [
          {
            startTime: "15:00",
            endTime: "17:00",
            title: "Arrival and settle in",
            category: "arrival",
          },
          { startTime: "17:30", title: "Welcome and mobility practice", category: "movement" },
          { startTime: "19:00", title: "Dinner", category: "food" },
          {
            startTime: "21:00",
            title: "Optional guided relaxation",
            category: "meditation",
            isOptional: true,
          },
        ],
      },
      {
        day: "Day 2",
        title: "Ground",
        activities: [
          "08:00 Morning strength and flow practice",
          "09:30 Breakfast",
          "11:00-14:00 Guided walk and lunch",
          "14:30-17:00 Free time",
          "17:00 Lower-body mobility workshop",
          "19:00 Dinner",
          "21:00 Optional meditation",
        ],
        items: [
          { startTime: "08:00", title: "Morning strength and flow practice", category: "yoga" },
          { startTime: "09:30", title: "Breakfast", category: "food" },
          {
            startTime: "11:00",
            endTime: "14:00",
            title: "Guided walk and lunch",
            category: "outdoors",
          },
          { startTime: "14:30", endTime: "17:00", title: "Free time", category: "free_time" },
          { startTime: "17:00", title: "Lower-body mobility workshop", category: "workshop" },
          { startTime: "19:00", title: "Dinner", category: "food" },
          {
            startTime: "21:00",
            title: "Optional meditation",
            category: "meditation",
            isOptional: true,
          },
        ],
      },
      {
        day: "Day 3",
        title: "Explore",
        activities: [
          "08:00 Morning yoga practice",
          "09:30 Breakfast",
          "11:00 Choice of longer or shorter walk",
          "14:00 Lunch",
          "15:00-17:00 Free time",
          "17:30 Restorative practice",
          "19:30 Dinner",
        ],
        items: [
          { startTime: "08:00", title: "Morning yoga practice", category: "yoga" },
          { startTime: "09:30", title: "Breakfast", category: "food" },
          { startTime: "11:00", title: "Choice of longer or shorter walk", category: "outdoors" },
          { startTime: "14:00", title: "Lunch", category: "food" },
          { startTime: "15:00", endTime: "17:00", title: "Free time", category: "free_time" },
          { startTime: "17:30", title: "Restorative practice", category: "yoga" },
          { startTime: "19:30", title: "Dinner", category: "food" },
        ],
      },
      {
        day: "Day 4",
        title: "Return",
        activities: [
          "08:00 Final morning practice",
          "09:30 Breakfast",
          "11:00 Workshop: Building a Sustainable Home Practice",
          "12:30 Lunch",
          "14:00 Closing and departure",
        ],
        items: [
          { startTime: "08:00", title: "Final morning practice", category: "yoga" },
          { startTime: "09:30", title: "Breakfast", category: "food" },
          {
            startTime: "11:00",
            title: "Workshop: Building a Sustainable Home Practice",
            category: "workshop",
          },
          { startTime: "12:30", title: "Lunch", category: "food" },
          { startTime: "14:00", title: "Closing and departure", category: "departure" },
        ],
      },
    ],
    accommodation:
      "Sample Shruti Turner retreat configuration for development and booking testing. These are not venue-published room prices.",
    suitableFor: [
      "Adults of all genders",
      "People who enjoy movement and time outside",
      "People who want active options without every minute being scheduled",
    ],
    foodAndDrinkDescription:
      "Meals are included throughout the retreat, with breakfast, lunch or a packed lunch depending on the day's activities, and dinner in the evening.",
    venue: ballintaggartVenue,
  },
  {
    id: "sankalpa-online-workshop",
    title: "Sankalpa: A Two-Hour Pause for Reflection and Intention",
    subtitle: "Gentle movement, reflection, journalling and deep rest online",
    slug: "sankalpa-online-workshop",
    experienceType: "online_workshop",
    deliveryMode: "online_live",
    durationLabel: "2 hours",
    audienceDescription:
      "Adults of all genders. No previous yoga or meditation experience is required.",
    experienceLevel: "No previous experience required",
    location: "Online (live through this website)",
    imageUrl: "/images/shruti.jpeg",
    shortDescription:
      "A two-hour online practice combining gentle movement, reflection, journalling and deep rest. Rather than creating another list of goals, this workshop gives you space to slow down and consider the direction you want to move in.",
    fullDescription: `You probably do not need another list of things to achieve.

This two-hour online workshop is an opportunity to pause before rushing into whatever comes next.

Through gentle movement, breath, guided reflection, journalling and yoga nidra, we will create some quiet space to explore what matters to you and what you would like to carry forward.

We will explore the idea of Sankalpa as an intention or inner resolve.

This is not a productivity exercise and there is no expectation that you arrive with a grand plan to reinvent your life.

No previous yoga or meditation experience is required.

Bring something comfortable to lie on, a notebook and a pen.`,
    dates: [
      {
        id: "sankalpa-online-workshop-2026-11-15",
        startDate: "2026-11-15",
        endDate: "2026-11-15",
        startDateTime: "2026-11-15T10:00:00.000+00:00",
        endDateTime: "2026-11-15T12:00:00.000+00:00",
        retreatType: "online",
        availableSpaces: 30,
        totalSpaces: 30,
        depositType: "full_payment",
        fixedDepositAmountPence: 2900,
        replayAccessDurationDays: 7,
        isRecorded: true,
        roomOptions: [
          roomOption({
            id: "live-workshop-ticket",
            slug: "live-workshop-ticket",
            label: "Live Workshop Ticket",
            description:
              "Live online workshop access with replay access for seven days once published.",
            type: "virtual",
            bookingUnit: "online_live_place",
            inventoryType: "online_live_place",
            inventoryQuantity: 30,
            guestsIncluded: 1,
            guestCountPerUnit: 1,
            capacity: 30,
            availableSpots: 30,
            normalPricePence: 2900,
            depositPence: 2900,
            ratePlans: [
              {
                guestCount: 1,
                totalPricePence: 2900,
                earlyBirdPricePence: 2500,
                earlyBirdEndsAt: "2026-10-16T22:59:59.000Z",
              },
            ],
            displayOrder: 1,
          }),
        ],
      },
    ],
    earlyBirdPrice: 25,
    earlyBirdDeadline: "2026-10-16T22:59:59.000Z",
    normalPrice: 29,
    currency: "GBP",
    included: ["live online workshop", "replay access for seven days once published"],
    notIncluded: ["1:1 support", "equipment", "ongoing access after the replay window closes"],
    schedule: [
      {
        day: "Workshop",
        title: "Sankalpa Online Workshop",
        activities: [
          "00:00-00:10 Arrival and grounding",
          "00:10-00:35 Gentle movement",
          "00:35-00:50 Breathwork and settling practice",
          "00:50-01:10 Introduction to Sankalpa and guided reflection",
          "01:10-01:25 Journalling",
          "01:25-01:50 Yoga nidra and intention practice",
          "01:50-02:00 Quiet closing",
        ],
        items: [
          {
            startTime: "00:00",
            endTime: "00:10",
            title: "Arrival and grounding",
            category: "meditation",
          },
          { startTime: "00:10", endTime: "00:35", title: "Gentle movement", category: "movement" },
          {
            startTime: "00:35",
            endTime: "00:50",
            title: "Breathwork and settling practice",
            category: "breathwork",
          },
          {
            startTime: "00:50",
            endTime: "01:10",
            title: "Introduction to Sankalpa and guided reflection",
            category: "workshop",
          },
          { startTime: "01:10", endTime: "01:25", title: "Journalling", category: "workshop" },
          {
            startTime: "01:25",
            endTime: "01:50",
            title: "Yoga nidra and intention practice",
            category: "meditation",
          },
          { startTime: "01:50", endTime: "02:00", title: "Quiet closing", category: "meditation" },
        ],
      },
    ],
    accommodation: "Online live workshop delivered through the website.",
    suitableFor: [
      "Adults of all genders",
      "People with no previous yoga or meditation experience",
      "People who want reflection and rest without turning it into another productivity task",
    ],
    foodAndDrinkDescription: "Bring anything you would like to drink during the session.",
    whatToBring: [
      "yoga mat or comfortable floor space",
      "blanket",
      "pillow or cushion",
      "notebook or journal",
      "pen",
      "somewhere comfortable to lie down",
    ],
    venue: onlineVenue,
  },
];
