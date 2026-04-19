import "server-only";

import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getBaseSiteUrlFromEnv } from "@/lib/env";

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
  defaultSeoTitle: "Shruti Turner - Strength & Yoga Coaching for Complex Bodies",
  defaultSeoDescription:
    "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
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
