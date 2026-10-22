import { describe, expect, it } from "vitest";
import {
  itemsToLines,
  linesToItems,
  parsePublishableRetreatExperienceContent,
  parseRetreatExperienceContent,
} from "@/lib/retreats/experience-schema";

describe("retreat experience content", () => {
  it("preserves optional gallery captions separately from image descriptions", () => {
    const photo = { url: "/images/retreat.jpg", alt: "Garden seating" };
    const result = parseRetreatExperienceContent({
      gallery: [photo, { ...photo, caption: "  A place to unwind.  " }],
    });
    expect(result.gallery[0].caption).toBeUndefined();
    expect(result.gallery[1].caption).toBe("A place to unwind.");
    expect(result.gallery[1].alt).toBe("Garden seating");
  });
  it("stores the schedule as one Markdown document and normalises optional fields", () => {
    const content = parseRetreatExperienceContent({
      schemaVersion: 1,
      title: "  The Middle Ground  ",
      scheduleMarkdown: "## Morning\n\n- Move\n- Reflect",
    });

    expect(content.title).toBe("The Middle Ground");
    expect(content.scheduleMarkdown).toContain("## Morning");
    expect(content.suitableFor).toEqual([]);
    expect(content.gallery).toEqual([]);
  });

  it("requires the small set of fields needed to publish", () => {
    expect(() =>
      parsePublishableRetreatExperienceContent({ schemaVersion: 1, title: "Draft" })
    ).toThrow("EXPERIENCE_NOT_READY:shortDescription,fullDescription,scheduleMarkdown");
  });

  it("converts line-based editor fields without retaining bullet syntax", () => {
    expect(linesToItems("- Yoga\n* Lunch\n\nWalk")).toEqual(["Yoga", "Lunch", "Walk"]);
    expect(itemsToLines(["Yoga", "Lunch"])).toBe("Yoga\nLunch");
  });

  it("accepts Contentful and local public images but rejects unsafe image locations", () => {
    const image = { alt: "Shruti moving outdoors", focalPoint: { x: 42, y: 38 } };

    expect(
      parseRetreatExperienceContent({
        image: { ...image, url: "https://images.example/image.jpg" },
      }).image?.url
    ).toBe("https://images.example/image.jpg");
    expect(
      parseRetreatExperienceContent({ image: { ...image, url: "/images/retreat.jpg" } }).image?.url
    ).toBe("/images/retreat.jpg");
    expect(() =>
      parseRetreatExperienceContent({ image: { ...image, url: "javascript:alert(1)" } })
    ).toThrow();
  });
});

it("persists ordered testimonial IDs through event content and rejects duplicates or more than three", () => {
  expect(
    parseRetreatExperienceContent({ testimonialIds: ["quote-b", "quote-a"] }).testimonialIds
  ).toEqual(["quote-b", "quote-a"]);
  expect(parseRetreatExperienceContent({}).testimonialIds).toEqual([]);
  expect(() => parseRetreatExperienceContent({ testimonialIds: ["a", "a"] })).toThrow();
  expect(() => parseRetreatExperienceContent({ testimonialIds: ["a", "b", "c", "d"] })).toThrow();
});

it("retains independent crop settings through JSON round-trips without changing old records", () => {
  const image = { url: "/photo.jpg", alt: "Photo", focalPoint: { x: 45, y: 60 } };
  expect(parseRetreatExperienceContent({ image }).image?.crops).toBeUndefined();
  const crops = { listing: { x: 10, y: 20, zoom: 1.25 }, hero: { x: 80, y: 50, zoom: 2 } };
  const saved = parseRetreatExperienceContent({ image: { ...image, crops } });
  expect(parseRetreatExperienceContent(JSON.parse(JSON.stringify(saved))).image?.crops).toEqual(
    crops
  );
  for (const invalid of [{ x: -1 }, { y: 101 }, { zoom: 0.5 }, { zoom: 2.01 }]) {
    expect(() =>
      parseRetreatExperienceContent({
        image: { ...image, crops: { listing: { ...crops.listing, ...invalid } } },
      })
    ).toThrow();
  }
});
