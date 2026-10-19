import { describe, expect, it, vi } from "vitest";
import type { RetreatCombinedContent } from "@/lib/content/types";
import { selectNextPublicExperience } from "@/lib/retreats/discovery";
vi.mock("@/lib/app-url", () => ({
  buildAbsoluteUrl: (path: string) => `https://shrutiturner.co.uk${path}`,
}));
import { createRetreatEventSchemas } from "@/lib/seo/structured-data";

const event: RetreatCombinedContent = {
  id: "event",
  slug: "event",
  title: "Published event",
  subtitle: "",
  location: "Stirling",
  imageUrl: "/images/shruti.jpeg",
  shortDescription: "",
  fullDescription: "",
  earlyBirdPrice: 35,
  normalPrice: 35,
  earlyBirdDeadline: "",
  currency: "GBP",
  included: [],
  notIncluded: [],
  schedule: [],
  accommodation: "",
  suitableFor: [],
  dates: [
    {
      id: "next",
      bookingOpen: true,
      startDate: "2030-06-01T10:00:00Z",
      endDate: "2030-06-01T12:00:00Z",
      retreatType: "online",
      availableSpaces: 10,
      totalSpaces: 10,
      addons: [],
      roomOptions: [
        {
          id: "ticket",
          label: "Ticket",
          description: "",
          type: "virtual",
          guestsIncluded: 1,
          capacity: 10,
          availableSpots: 10,
          normalPricePence: 3500,
        },
      ],
    },
  ],
};
const now = new Date("2030-01-01T00:00:00Z").getTime();
describe("next published experience", () => {
  it("selects the earliest future bookable date without mutating its input", () => {
    const later = {
      ...event,
      dates: [{ ...event.dates[0], id: "later", startDate: "2030-07-01T10:00:00Z" }],
    };
    expect(selectNextPublicExperience([later, event], now)?.date.id).toBe("next");
    expect(later.dates[0].id).toBe("later");
  });
  it.each([
    { bookingOpen: false },
    { bookingOpen: undefined },
    { availableSpaces: 0 },
    { startDate: "2029-12-31T10:00:00Z" },
    { startDate: "invalid" },
    { roomOptions: [] },
    { roomOptions: [{ ...event.dates[0].roomOptions[0], availableSpots: 0 }] },
    { roomOptions: [{ ...event.dates[0].roomOptions[0], isWaitlistOnly: true }] },
  ])("omits unavailable or unconfirmed dates: %j", (overrides) => {
    expect(
      selectNextPublicExperience([{ ...event, dates: [{ ...event.dates[0], ...overrides }] }], now)
    ).toBeNull();
  });
  it("handles an empty public catalogue", () =>
    expect(selectNextPublicExperience([], now)).toBeNull());
});

describe("event search facts", () => {
  it("supports ticket prices without rate plans and per-date online locations", () => {
    expect(createRetreatEventSchemas(event)[0]).toMatchObject({
      location: { "@type": "VirtualLocation" },
      image: "https://shrutiturner.co.uk/images/shruti.jpeg",
      offers: {
        price: "35.00",
        availability: "https://schema.org/InStock",
        url: "https://shrutiturner.co.uk/retreats/event?date=next",
      },
    });
  });
  it("does not advertise cheaper sold-out rooms as available", () => {
    const date = {
      ...event.dates[0],
      roomOptions: [
        { ...event.dates[0].roomOptions[0], normalPricePence: 2000, availableSpots: 0 },
        event.dates[0].roomOptions[0],
      ],
    };
    expect(createRetreatEventSchemas({ ...event, dates: [date] })[0].offers).toMatchObject({
      price: "35.00",
    });
    expect(
      createRetreatEventSchemas({ ...event, dates: [{ ...date, bookingOpen: false }] })[0].offers
    ).toMatchObject({ availability: "https://schema.org/SoldOut" });
  });
  it("uses structured venue address facts without inventing missing fields", () => {
    const dated = {
      ...event,
      dates: [
        {
          ...event.dates[0],
          retreatType: "in_person" as const,
          venue: {
            slug: "venue",
            name: "Venue",
            displayLocation: "Stirling",
            addressLine1: "Example Road",
            townOrCity: "Stirling",
            postcode: "TEST",
          },
        },
      ],
    };
    expect(createRetreatEventSchemas(dated)[0].location).toMatchObject({
      name: "Venue",
      address: { "@type": "PostalAddress", streetAddress: "Example Road", postalCode: "TEST" },
    });
  });
});
