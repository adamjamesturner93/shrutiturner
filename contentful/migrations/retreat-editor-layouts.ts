import type { FieldGroupItem } from "contentful-management";

const group = (groupId: string, name: string, fields: string[]): FieldGroupItem => ({
  groupId,
  name,
  items: fields.map((fieldId) => ({ fieldId })),
});
export const RETREAT_EDITOR_LAYOUTS: Record<string, FieldGroupItem[]> = {
  retreatTemplate: [
    group("experience", "Experience and format", [
      "title",
      "subtitle",
      "slug",
      "experienceType",
      "deliveryMode",
      "durationLabel",
      "venue",
    ]),
    group("story", "Public page copy", [
      "shortDescription",
      "fullDescription",
      "atmosphereDescription",
      "audienceDescription",
      "experienceLevel",
      "suitableFor",
    ]),
    group("images", "Photography", ["heroImage", "heroImageUrl", "gallery"]),
    group("visit", "What guests can expect", [
      "included",
      "notIncluded",
      "whatToBring",
      "foodAndDrinkDescription",
      "accommodationDescription",
      "scheduleDays",
    ]),
    group("search", "Search engines", ["seoTitle", "seoDescription"]),
  ],
  retreatVenue: [
    group("venue", "Venue story", ["name", "slug", "displayLocation", "description"]),
    group("address", "Address", [
      "address",
      "addressLine1",
      "addressLine2",
      "townOrCity",
      "region",
      "postcode",
      "country",
    ]),
    group("travel", "Travel and arrival", [
      "travelInformation",
      "arrivalInformation",
      "travelByTrain",
      "travelByCar",
      "travelByAir",
      "localTransferInformation",
    ]),
    group("facilities", "Facilities and access", [
      "facilities",
      "accessibilityNotes",
      "kitchenAccessDescription",
    ]),
  ],
};
