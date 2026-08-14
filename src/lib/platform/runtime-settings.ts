import "server-only";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { env, getBaseSiteUrlFromEnv } from "@/lib/env";

export type RuntimePlatformSettings = {
  businessName: string;
  supportEmail: string | null;
  contactEmail: string | null;
  instagramUrl: string | null;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
  gaMeasurementId: string | null;
};

const DEFAULT_SEO_TITLE = "Personal Training & Movement Coaching | Shruti Turner";
const DEFAULT_SEO_DESCRIPTION =
  "Personal training and movement coaching bringing together rehabilitation, fitness and wellbeing, built around your body, goals and real life.";
const DEFAULT_SOCIAL_IMAGE = "https://shrutiturner.co.uk/social/active";
const CANONICAL_SITE_URL = "https://shrutiturner.co.uk";

const LEGACY_DEFAULT_SEO_TITLES = new Set([
  "Yoga, Strength & Coaching for Chronic Illness",
  "Shruti Turner - Inclusive Movement Coaching",
  "Strength & Yoga for Complex Bodies",
  "Inclusive Movement Coaching",
]);

const LEGACY_DEFAULT_SEO_DESCRIPTIONS = new Set([
  "Science-backed movement coaching for adults with chronic illness, autoimmune conditions, wellbeing and injury recovery or prevention.",
  "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
  "Inclusive movement coaching for chronic illness, autoimmune conditions, wellbeing and injury recovery or prevention.",
]);

export const DEFAULT_RUNTIME_PLATFORM_SETTINGS: RuntimePlatformSettings = {
  businessName: "Shruti Turner",
  supportEmail: null,
  contactEmail: null,
  instagramUrl: "https://instagram.com/shrutiturner",
  defaultSeoTitle: DEFAULT_SEO_TITLE,
  defaultSeoDescription: DEFAULT_SEO_DESCRIPTION,
  gaMeasurementId: null,
};

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveDefaultSeoTitle(value: string | null | undefined) {
  const resolved = trimOrNull(value);
  return !resolved || LEGACY_DEFAULT_SEO_TITLES.has(resolved) ? DEFAULT_SEO_TITLE : resolved;
}

function resolveDefaultSeoDescription(value: string | null | undefined) {
  const resolved = trimOrNull(value);
  return !resolved || LEGACY_DEFAULT_SEO_DESCRIPTIONS.has(resolved)
    ? DEFAULT_SEO_DESCRIPTION
    : resolved;
}

export async function getRuntimePlatformSettings(): Promise<RuntimePlatformSettings> {
  "use cache";

  const row = await db.platformSetting.findUnique({
    where: { id: "default" },
    select: {
      businessName: true,
      supportEmail: true,
      contactEmail: true,
      instagramUrl: true,
      defaultSeoTitle: true,
      defaultSeoDescription: true,
      gaMeasurementId: true,
    },
  });

  if (!row) {
    return DEFAULT_RUNTIME_PLATFORM_SETTINGS;
  }

  return {
    businessName: trimOrNull(row.businessName) || DEFAULT_RUNTIME_PLATFORM_SETTINGS.businessName,
    supportEmail: trimOrNull(row.supportEmail),
    contactEmail: trimOrNull(row.contactEmail),
    instagramUrl: trimOrNull(row.instagramUrl) || DEFAULT_RUNTIME_PLATFORM_SETTINGS.instagramUrl,
    defaultSeoTitle: resolveDefaultSeoTitle(row.defaultSeoTitle),
    defaultSeoDescription: resolveDefaultSeoDescription(row.defaultSeoDescription),
    gaMeasurementId: trimOrNull(row.gaMeasurementId),
  };
}

export async function buildRootMetadata(): Promise<Metadata> {
  const settings = await getRuntimePlatformSettings();
  const metadataBase = new URL(getBaseSiteUrlFromEnv());
  const titleDefault = settings.defaultSeoTitle || settings.businessName;
  const gaMeasurementId = settings.gaMeasurementId || env.GA4_MEASUREMENT_ID || null;

  return {
    metadataBase,
    title: {
      default: titleDefault,
      template: `%s | ${settings.businessName}`,
    },
    description:
      settings.defaultSeoDescription || DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoDescription,
    applicationName: settings.businessName,
    alternates: {
      canonical: `${CANONICAL_SITE_URL}/`,
    },
    openGraph: {
      type: "website",
      siteName: settings.businessName,
      title: titleDefault,
      description:
        settings.defaultSeoDescription || DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoDescription,
      url: `${CANONICAL_SITE_URL}/`,
      images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: "Shruti Turner movement coaching" }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description:
        settings.defaultSeoDescription || DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoDescription,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    other: gaMeasurementId
      ? {
          "google-analytics-measurement-id": gaMeasurementId,
        }
      : undefined,
    icons: {
      icon: [
        { url: "/icon", sizes: "32x32", type: "image/png" },
        { url: "/logos/logo-colour-icon-only.svg", type: "image/svg+xml" },
      ],
      shortcut: [{ url: "/icon", sizes: "32x32", type: "image/png" }],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    },
  };
}
