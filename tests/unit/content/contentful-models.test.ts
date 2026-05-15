import { describe, expect, it } from "vitest";
import { PUBLIC_CONTENT_MODELS } from "../../../contentful/migrations/001-public-content-models";
import { SEED_GROUPS } from "../../../contentful/seed/public-seed";

const retainedContentTypes = [
  "authorProfile",
  "blogPost",
  "classDefinition",
  "faqItem",
  "instructorProfile",
  "leadMagnet",
  "newsletterSignupContent",
  "newsletterTemplate",
  "retreatTemplate",
  "retreatVenue",
  "smallGroupProgramme",
  "testimonial",
] as const;

const retiredContentTypes = [
  "globalContent",
  "legalDocument",
  "trustBadge",
  "contactBlock",
  "announcementBanner",
  "themedWeekPromo",
  "transactionalEmailTemplate",
  "retreatInstance",
] as const;

describe("Contentful public content models", () => {
  it("keeps only business-owner editable marketing and newsletter models", () => {
    const modelIds = PUBLIC_CONTENT_MODELS.map((model) => model.id).sort();

    expect(modelIds).toEqual([...retainedContentTypes].sort());
    expect(modelIds).not.toEqual(expect.arrayContaining([...retiredContentTypes]));
  });

  it("seeds only retained Contentful models", () => {
    const seededTypes = SEED_GROUPS.map((group) => group.contentType).sort();

    expect(seededTypes).toEqual([...retainedContentTypes].sort());
  });

  it("keeps newsletter scheduling and test-mode fields in the Contentful model", () => {
    const newsletterModel = PUBLIC_CONTENT_MODELS.find(
      (model) => model.id === "newsletterTemplate"
    );

    expect(newsletterModel?.fields.map((field) => field.id)).toEqual(
      expect.arrayContaining(["sendDate", "segmentation", "testMode"])
    );
  });

  it("seeds multiple blog authors and at least one joint-authored post", () => {
    const authorGroup = SEED_GROUPS.find((group) => group.contentType === "authorProfile");
    const blogGroup = SEED_GROUPS.find((group) => group.contentType === "blogPost");
    const seededBlogPosts = (blogGroup?.entries ?? []) as Array<{ authorSlugs?: string[] }>;

    expect(authorGroup?.entries.length).toBeGreaterThanOrEqual(2);
    expect(seededBlogPosts.length).toBeGreaterThanOrEqual(10);
    expect(seededBlogPosts.some((post) => (post.authorSlugs?.length ?? 0) > 1)).toBe(true);
  });
});
