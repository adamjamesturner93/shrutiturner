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
    expect(fieldIds).toContain("category");
    expect(blogModel?.fields.find((field) => field.id === "category")?.validations).toEqual([
      { in: ["rehabilitation", "fitness", "wellbeing"] },
    ]);
  });

  it("keeps testimonials focused on author, quote and homepage visibility", () => {
    const testimonialModel = PUBLIC_CONTENT_MODELS.find((model) => model.id === "testimonial");
    const testimonialGroup = SEED_GROUPS.find((group) => group.contentType === "testimonial");
    const fieldIds = testimonialModel?.fields.map((field) => field.id) ?? [];
    const testimonials = (testimonialGroup?.entries ?? []) as Array<{
      slug?: string;
      authorName?: string;
      authorCondition?: string;
      service?: string;
    }>;

    expect(fieldIds).toEqual(expect.arrayContaining(["slug", "quote", "authorName", "featured"]));
    expect(fieldIds).not.toEqual(expect.arrayContaining(["authorCondition", "service"]));
    expect(testimonials.every((item) => item.slug === item.authorName?.toLowerCase())).toBe(true);
    expect(testimonials.every((item) => !item.authorCondition && !item.service)).toBe(true);
  });

  it("seeds only the approved real blog author and excludes placeholder articles", () => {
    const authorGroup = SEED_GROUPS.find((group) => group.contentType === "authorProfile");
    const blogGroup = SEED_GROUPS.find((group) => group.contentType === "blogPost");
    const seededAuthors = (authorGroup?.entries ?? []) as Array<{ slug?: string }>;
    const seededBlogPosts = (blogGroup?.entries ?? []) as Array<{
      slug?: string;
      authorSlugs?: string[];
    }>;

    expect(seededAuthors.map((author) => author.slug)).toEqual(["shruti-turner"]);
    expect(seededBlogPosts.length).toBeGreaterThanOrEqual(6);
    expect(seededBlogPosts.every((post) => post.authorSlugs?.includes("shruti-turner"))).toBe(true);
    expect(seededBlogPosts.map((post) => post.slug)).not.toEqual(
      expect.arrayContaining([
        "arthritis-exercise-guide",
        "pain-during-exercise-modify-or-stop",
        "breathwork-for-chronic-pain",
        "returning-after-a-flare-coach-physio",
        "good-small-group-programme",
      ])
    );
  });
});
