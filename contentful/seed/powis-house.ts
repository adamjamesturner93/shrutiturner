import type { Retreat } from "../../src/data/retreat-data.ts";

// Restored from the original Powis House fixture (2e74dd5). Kept separate from
// the default catalogue so sandbox test content is only seeded explicitly.
export const powisHouseRetreat: Retreat = {
  id: "pause-move-breathe-stirling",
  slug: "pause-move-breathe-stirling",
  title: "Pause, Move, Breathe: A Yoga Weekend in Stirling",
  subtitle: "A relaxed weekend of yoga, movement, good food and space to slow down",
  experienceType: "residential_retreat",
  deliveryMode: "in_person",
  durationLabel: "3 days / 2 nights",
  audienceDescription: "Adults of all genders, including people who are relatively new to yoga.",
  experienceLevel: "All levels",
  location: "Stirling, Scotland",
  imageUrl: "/images/shruti-coaching.jpeg",
  shortDescription:
    "A relaxed weekend of yoga, movement, good food, fresh air and proper time to slow down.",
  fullDescription: `__Pause, move and breathe in the Scottish countryside.__

Join Shruti for a small, relaxed weekend with yoga, movement, good food and enough free time to enjoy being away.

Across the weekend we will practise in different ways. Some sessions will be energising and playful, with elements of strength, balance and mobility. Others will be slower and quieter.

There will be time outside, time to eat together and plenty of time that has deliberately not been filled with activities.

You can come on your own, with a friend or with a partner. The retreat is open to adults of all genders and is suitable for different levels of yoga experience.

*Nothing on the schedule is compulsory. This is your weekend too.*`,
  atmosphereDescription:
    "A relaxed countryside weekend with spacious movement, shared meals, fresh air and quiet time. Join in at your own pace, with room to rest whenever you need.",
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
        {
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
          displayOrder: 1,
          ratePlans: [
            {
              guestCount: 1,
              totalPricePence: 42500,
              earlyBirdPricePence: 39500,
              earlyBirdEndsAt: "2026-08-14T22:59:59.000Z",
            },
          ],
        },
        {
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
          displayOrder: 2,
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
        },
      ],
    },
  ],
  earlyBirdPrice: 395,
  earlyBirdDeadline: "2026-08-14T22:59:59.000Z",
  normalPrice: 425,
  currency: "GBP",
  included: [
    "Two nights' accommodation",
    "All scheduled yoga and movement sessions",
    "Guided relaxation",
    "Brunch and dinner",
    "Tea and basic refreshments",
    "Kitchen access for simple snacks",
  ],
  notIncluded: ["Travel to and from the retreat", "Travel insurance", "Personal purchases"],
  schedule: [
    {
      day: "Day 1",
      title: "Arrive and Exhale",
      activities: [
        "16:00–18:00 Arrival and check-in",
        "18:00–19:00 Welcome and grounding practice",
        "19:30 Dinner",
        "21:00 Optional guided relaxation",
      ],
    },
    {
      day: "Day 2",
      title: "Move, Explore and Restore",
      activities: [
        "08:00–09:30 Morning yoga",
        "10:00 Brunch",
        "11:30 Outdoor time or local walk",
        "13:30–16:00 Free time",
        "16:00–17:30 Movement workshop",
        "19:00 Dinner",
        "21:00 Optional slow practice or meditation",
      ],
    },
    {
      day: "Day 3",
      title: "Reflect and Return",
      activities: [
        "08:00–09:15 Slow flow and breathwork",
        "10:00 Brunch",
        "11:30–12:45 Closing workshop and reflection",
        "13:00–14:00 Closing circle and departures",
      ],
    },
  ],
  accommodation:
    "Shared twin bed spaces and private king rooms at Powis House. One shared twin booking reserves one bed space.",
  suitableFor: [
    "Adults of all genders",
    "People with a range of yoga experience",
    "People who are relatively new to yoga",
    "People who want movement, rest and time outdoors without a packed schedule",
  ],
  foodAndDrinkDescription:
    "Brunch and dinner are included. The kitchen is available for making drinks and simple snacks between meals.",
  whatToBring: [
    "Comfortable movement clothes",
    "A yoga mat",
    "Outdoor shoes and layers",
    "A notebook and pen",
  ],
  venue: {
    slug: "powis-house",
    name: "Powis House",
    displayLocation: "Stirling, Scotland",
    description: "A countryside setting near Stirling with space to gather, practise and rest.",
    address: "Powis House, Stirling, Scotland",
    addressLine1: "Powis House",
    townOrCity: "Stirling",
    country: "Scotland",
    facilities: ["Indoor practice space", "Outdoor space", "Kitchen access"],
    accessibilityNotes: "Contact Shruti before booking to discuss access needs for this venue.",
    travelInformation:
      "Plan your journey via Stirling. Contact Shruti to coordinate arrival and local transfers.",
    travelByTrain: "Stirling is the recommended railway arrival point.",
    arrivalInformation: "Arrival and check-in are between 16:00 and 18:00 on Friday.",
    kitchenAccessDescription:
      "The kitchen is available for making drinks and simple snacks between meals.",
  },
};
