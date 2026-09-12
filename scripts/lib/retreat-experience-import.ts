import { createHash } from "node:crypto";

export function contentHash(content: unknown): string {
  return createHash("sha256").update(JSON.stringify(content)).digest("hex");
}

/** Fail closed when the current single-locale converter would silently drop editorial data. */
export function importConversionWarnings(
  fields: Record<string, Record<string, unknown>>,
  locale: string
) {
  const mapped = new Set([
    "slug",
    "title",
    "experienceType",
    "scheduleDays",
    "schedule",
    "heroImage",
    "heroImageUrl",
    "subtitle",
    "shortDescription",
    "fullDescription",
    "atmosphereDescription",
    "audienceDescription",
    "experienceLevel",
    "suitableFor",
    "included",
    "notIncluded",
    "whatToBring",
    "foodAndDrinkDescription",
    "accommodationDescription",
    "durationLabel",
    "seoTitle",
    "seoDescription",
  ]);
  const populated = (value: unknown) =>
    value !== null &&
    value !== undefined &&
    value !== "" &&
    (!Array.isArray(value) || value.length > 0);
  const warnings: string[] = [];
  for (const [key, localized] of Object.entries(fields)) {
    for (const [language, value] of Object.entries(localized || {})) {
      if (!populated(value)) continue;
      if (language !== locale) warnings.push(`additional_locale:${key}:${language}`);
      else if (!mapped.has(key)) warnings.push(`unmapped_field:${key}`);
    }
  }
  return warnings.sort();
}

export type ReviewedImportUpdate = {
  expectedRevision: number;
  expectedAppDraftHash: string;
  expectedSourceDraftHash: string;
  expectedSourcePublishedHash: string | null;
};

export function assertReviewedImportUpdate(review: ReviewedImportUpdate, current: {
  revision: number; draftContentJson: unknown;
}, source: { hash: string; publishedHash: string | null }) {
  if (!review || !Number.isSafeInteger(review.expectedRevision) || current.revision !== review.expectedRevision ||
      contentHash(current.draftContentJson) !== review.expectedAppDraftHash ||
      source.hash !== review.expectedSourceDraftHash || source.publishedHash !== review.expectedSourcePublishedHash) {
    throw new Error("REVIEWED_IMPORT_STALE: Review the current app draft and source snapshots again.");
  }
}

type ImportIdentity = { entryId: string; spaceId: string; environment: string; locale: string };
type ExistingImport = {
  sourceContentfulEntryId: string | null;
  sourceContentfulSpaceId: string | null;
  sourceContentfulEnvironment: string | null;
  sourceContentfulLocale: string | null;
  sourceContentfulHash: string | null;
  sourceContentfulPublishedHash: string | null;
};

/** Reimports never overwrite app-owned content, even if the source has changed. */
export function planExperienceImport(
  input: ImportIdentity & {
    existing: ExistingImport | null;
    slugCollision: boolean;
    draftHash: string;
    publishedHash: string | null;
  }
) {
  if (!input.existing) return input.slugCollision ? "slug_conflict" : "create";
  const record = input.existing;
  if (
    record.sourceContentfulEntryId !== input.entryId ||
    record.sourceContentfulSpaceId !== input.spaceId ||
    record.sourceContentfulEnvironment !== input.environment ||
    record.sourceContentfulLocale !== input.locale
  )
    return "provenance_requires_review";
  if (
    record.sourceContentfulHash !== input.draftHash ||
    record.sourceContentfulPublishedHash !== input.publishedHash
  )
    return "source_changed_requires_review";
  return "unchanged";
}
