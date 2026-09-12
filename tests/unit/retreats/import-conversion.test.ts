import { describe, expect, it } from "vitest";
import { importConversionWarnings, assertReviewedImportUpdate, contentHash } from "../../../scripts/lib/retreat-experience-import";

describe("Contentful conversion loss guard", () => {
  it("reports galleries rather than silently emptying them", () => {
    expect(
      importConversionWarnings({ gallery: { "en-GB": [{ sys: { id: "photo" } }] } }, "en-GB")
    ).toEqual(["unmapped_field:gallery"]);
  });
  it("reports additional locales without pretending a default-locale import preserves them", () => {
    expect(
      importConversionWarnings({ title: { "en-GB": "Retreat", fr: "Séjour" } }, "en-GB")
    ).toEqual(["additional_locale:title:fr"]);
  });
  it("accepts supported fields and empty legacy fields", () => {
    expect(
      importConversionWarnings({ title: { "en-GB": "Retreat" }, retired: { "en-GB": [] } }, "en-GB")
    ).toEqual([]);
  });
});

describe("reviewed draft import", () => {
  const draft = { title: "App edit" };
  const review = { expectedRevision: 3, expectedAppDraftHash: contentHash(draft),
    expectedSourceDraftHash: "new-draft", expectedSourcePublishedHash: "published-v1" };
  const current = { revision: 3, draftContentJson: draft };
  const source = { hash: "new-draft", publishedHash: "published-v1" };
  it("accepts an exact reviewed app and source snapshot", () => {
    expect(() => assertReviewedImportUpdate(review, current, source)).not.toThrow();
  });
  it("rejects a concurrent app edit", () => {
    expect(() => assertReviewedImportUpdate(review, { ...current, revision: 4 }, source)).toThrow("REVIEWED_IMPORT_STALE");
    expect(() => assertReviewedImportUpdate(review, { ...current, draftContentJson: { title: "Changed" } }, source)).toThrow("REVIEWED_IMPORT_STALE");
  });
  it("rejects changed draft or published source", () => {
    expect(() => assertReviewedImportUpdate(review, current, { ...source, hash: "v3" })).toThrow("REVIEWED_IMPORT_STALE");
    expect(() => assertReviewedImportUpdate(review, current, { ...source, publishedHash: "published-v2" })).toThrow("REVIEWED_IMPORT_STALE");
  });
});
