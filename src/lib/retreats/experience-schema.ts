import { z } from "zod";

const optionalText = z.string().trim().max(12_000).default("");
const shortOptionalText = z.string().trim().max(320).default("");
const retreatImageUrlSchema = z
  .string()
  .trim()
  .max(2_048)
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) || /^https?:\/\/[^\s]+$/i.test(value),
    "Enter an absolute http(s) URL or a site-relative path beginning with /."
  );

export const retreatImageSchema = z.object({
  assetId: z.string().trim().max(128).optional(),
  url: retreatImageUrlSchema,
  alt: z.string().trim().min(1).max(240),
  focalPoint: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .default({ x: 50, y: 50 }),
});

export const retreatExperienceContentSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  title: z.string().trim().max(180).default(""),
  subtitle: z.string().trim().max(320).default(""),
  shortDescription: z.string().trim().max(500).default(""),
  fullDescription: z.string().trim().max(20_000).default(""),
  scheduleMarkdown: z.string().trim().max(20_000).default(""),
  atmosphereDescription: optionalText,
  audienceDescription: optionalText,
  experienceLevel: shortOptionalText,
  suitableFor: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
  included: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
  notIncluded: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
  whatToBring: z.array(z.string().trim().min(1).max(300)).max(40).default([]),
  foodAndDrinkDescription: optionalText,
  accommodationDescription: optionalText,
  durationLabel: shortOptionalText,
  image: retreatImageSchema.optional(),
  gallery: z.array(retreatImageSchema).max(8).default([]),
  seoTitle: z.string().trim().max(180).default(""),
  seoDescription: z.string().trim().max(320).default(""),
});

export const retreatFormatDefaultsSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  timezone: z.string().trim().min(1).max(80).refine((value) => {
    try { new Intl.DateTimeFormat("en-GB", { timeZone: value }); return true; }
    catch { return false; }
  }, "Choose a valid IANA timezone.").default("Europe/London"),
  durationMinutes: z
    .number()
    .int()
    .positive()
    .max(60 * 24 * 14)
    .optional(),
  capacity: z.number().int().positive().max(500).default(12),
  currency: z.literal("GBP").default("GBP"),
  pricePence: z.number().int().nonnegative().default(0),
  paymentPolicy: z.enum(["deposit", "full_payment"]).default("full_payment"),
  venueProfileId: z.string().trim().min(1).optional(),
  isRecorded: z.boolean().default(false),
  replayAccessDurationDays: z.number().int().positive().max(365).optional(),
  chatEnabled: z.boolean().default(true),
});

export type RetreatExperienceContent = z.infer<typeof retreatExperienceContentSchema>;
export type RetreatFormatDefaults = z.infer<typeof retreatFormatDefaultsSchema>;

export function parseRetreatExperienceContent(value: unknown) {
  return retreatExperienceContentSchema.parse(value);
}

export function parsePublishableRetreatExperienceContent(value: unknown) {
  const content = parseRetreatExperienceContent(value);
  const missing = [
    ["title", content.title],
    ["shortDescription", content.shortDescription],
    ["fullDescription", content.fullDescription],
    ["scheduleMarkdown", content.scheduleMarkdown],
  ].filter(([, fieldValue]) => !fieldValue);
  if (missing.length) {
    throw new Error(`EXPERIENCE_NOT_READY:${missing.map(([field]) => field).join(",")}`);
  }
  return content;
}

export function parseRetreatFormatDefaults(value: unknown) {
  return retreatFormatDefaultsSchema.parse(value);
}

export function linesToItems(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);
}

export function itemsToLines(items: string[]) {
  return items.join("\n");
}
