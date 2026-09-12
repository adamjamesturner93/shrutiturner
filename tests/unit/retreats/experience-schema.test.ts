import { describe, expect, it } from "vitest";
import {
  itemsToLines,
  linesToItems,
  parsePublishableRetreatExperienceContent,
  parseRetreatExperienceContent,
} from "@/lib/retreats/experience-schema";

describe("retreat experience content", () => {
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
