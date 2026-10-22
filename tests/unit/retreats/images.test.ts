import { describe, expect, it } from "vitest";
import { getRetreatCardImagePosition, getRetreatImageStyle } from "@/lib/retreats/images";

describe("retreat card photo focus", () => {
  it("keeps the hiking selfie focused lower in the portrait, including with a query", () => {
    expect(getRetreatCardImagePosition("/images/shruti-hiking-selfie.jpeg")).toBe("50% 68%");
    expect(getRetreatCardImagePosition("/images/shruti-hiking-selfie.jpeg?v=2")).toBe("50% 68%");
  });
  it("preserves the coaching portrait crop and centres unfamiliar images", () => {
    expect(getRetreatCardImagePosition("/images/shruti-coaching.jpeg")).toBe("50% 0%");
    expect(getRetreatCardImagePosition("https://images.ctfassets.net/photo.jpg")).toBe("50% 50%");
  });
});

it("keeps legacy focus and isolates listing and hero crops", () => {
  const crops = { listing: { x: 20, y: 10, zoom: 1.5 } };
  expect(getRetreatImageStyle("/photo.jpg", { x: 45, y: 60 }, undefined, "listing")).toMatchObject({
    objectPosition: "45% 60%",
    transform: undefined,
  });
  expect(getRetreatImageStyle("/photo.jpg", { x: 45, y: 60 }, crops, "listing")).toMatchObject({
    objectPosition: "20% 10%",
    transformOrigin: "20% 10%",
    transform: "scale(1.5)",
  });
  expect(getRetreatImageStyle("/photo.jpg", { x: 45, y: 60 }, crops, "hero")).toMatchObject({
    objectPosition: "45% 60%",
    transform: undefined,
  });
});
