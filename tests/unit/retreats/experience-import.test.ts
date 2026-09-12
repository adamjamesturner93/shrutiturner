import { describe, expect, it } from "vitest";
import { contentHash, planExperienceImport } from "../../../scripts/lib/retreat-experience-import";

const identity = { entryId: "entry", spaceId: "space", environment: "sandbox", locale: "en-GB" };
const existing = {
  sourceContentfulEntryId: "entry", sourceContentfulSpaceId: "space",
  sourceContentfulEnvironment: "sandbox", sourceContentfulLocale: "en-GB",
  sourceContentfulHash: "draft", sourceContentfulPublishedHash: "published",
};
const input = { ...identity, existing, slugCollision: false, draftHash: "draft", publishedHash: "published" };
describe("non-destructive experience import planning", () => {
  it("creates only when neither identity nor slug exists", () => {
    expect(planExperienceImport({ ...input, existing: null })).toBe("create");
    expect(planExperienceImport({ ...input, existing: null, slugCollision: true })).toBe("slug_conflict");
  });
  it("requires review for legacy or different-environment provenance", () => {
    expect(planExperienceImport({ ...input, existing: { ...existing, sourceContentfulSpaceId: null } })).toBe("provenance_requires_review");
    expect(planExperienceImport({ ...input, environment: "master" })).toBe("provenance_requires_review");
  });
  it("never updates changed source or unpublishes an app record", () => {
    expect(planExperienceImport({ ...input, draftHash: "new" })).toBe("source_changed_requires_review");
    expect(planExperienceImport({ ...input, publishedHash: null })).toBe("source_changed_requires_review");
    expect(planExperienceImport(input)).toBe("unchanged");
  });
  it("distinguishes unpublished changes from the published snapshot", () => {
    expect(contentHash({ title: "V1" })).not.toBe(contentHash({ title: "V2" }));
    expect(contentHash({ title: "V1" })).toBe(contentHash({ title: "V1" }));
  });
});
