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
  "retreatEvent",
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

  it("keeps newsletter publishing controlled by Contentful publish state", () => {
    const newsletterModel = PUBLIC_CONTENT_MODELS.find(
      (model) => model.id === "newsletterTemplate"
    );
    const fieldIds = newsletterModel?.fields.map((field) => field.id) ?? [];

    expect(fieldIds).toEqual(expect.arrayContaining(["slug", "title", "subject", "body"]));
    expect(fieldIds).not.toEqual(expect.arrayContaining(["sendDate", "status", "testMode"]));
  });

  it("keeps blog author and publish date derived from linked profiles and Contentful metadata", () => {
    const blogModel = PUBLIC_CONTENT_MODELS.find((model) => model.id === "blogPost");
    const authorModel = PUBLIC_CONTENT_MODELS.find((model) => model.id === "authorProfile");
    const fieldIds = blogModel?.fields.map((field) => field.id) ?? [];
    const authorFieldIds = authorModel?.fields.map((field) => field.id) ?? [];

    expect(fieldIds).toEqual(
      expect.arrayContaining(["coverImageAsset", "coverImageUrl", "authors"])
    );
    expect(authorFieldIds).toEqual(expect.arrayContaining(["avatarImageAsset"]));
    expect(fieldIds).not.toEqual(
      expect.arrayContaining(["authorName", "publishDate", "isNewsletter"])
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
