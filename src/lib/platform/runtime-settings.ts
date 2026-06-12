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

export const DEFAULT_RUNTIME_PLATFORM_SETTINGS: RuntimePlatformSettings = {
  businessName: "Shruti Turner",
  supportEmail: null,
  contactEmail: null,
  instagramUrl: "https://instagram.com/shrutiturner",
  defaultSeoTitle: "Shruti Turner - Inclusive Movement Coaching",
  defaultSeoDescription:
    "Science-backed movement coaching for adults with chronic illness, autoimmune conditions, wellbeing and injury recovery or prevention.",
  gaMeasurementId: null,
};

function trimOrNull(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
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
    defaultSeoTitle:
      trimOrNull(row.defaultSeoTitle) || DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoTitle,
    defaultSeoDescription:
      trimOrNull(row.defaultSeoDescription) ||
      DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoDescription,
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
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: settings.businessName,
      title: titleDefault,
      description:
        settings.defaultSeoDescription || DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoDescription,
      url: metadataBase,
    },
    twitter: {
      card: "summary_large_image",
      title: titleDefault,
      description:
        settings.defaultSeoDescription || DEFAULT_RUNTIME_PLATFORM_SETTINGS.defaultSeoDescription,
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
