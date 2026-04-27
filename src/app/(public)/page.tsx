import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { HomePage } from "@/views/home";
import { buildPageMetadata, buildSeoMetadata } from "@/lib/content/metadata";
import {
  createOrganizationSchema,
  createWebPageSchema,
  createWebSiteSchema,
} from "@/lib/seo/structured-data";
import { getExistingPlatformUrl, isHoldingStage } from "@/lib/site-stage";
import { HoldingPage } from "@/views/holding-page";

export async function generateMetadata(): Promise<Metadata> {
  if (isHoldingStage()) {
    return buildSeoMetadata({
      title: "Something new is coming",
      description:
        "A new home for evidence-based coaching, movement classes, and community is launching in early summer 2026.",
      canonicalUrl: "https://shrutiturner.co.uk",
    });
  }

  return buildPageMetadata("home", "Strength & Yoga for Complex Bodies");
}

export default function Page() {
  if (isHoldingStage()) {
    return (
      <>
        <JsonLd
          data={createWebPageSchema({
            name: "Shruti Turner",
            path: "/",
            description:
              "A new home for evidence-based coaching, movement classes, and community is launching in early summer 2026.",
          })}
        />
        <HoldingPage existingPlatformUrl={getExistingPlatformUrl()} />
      </>
    );
  }

  return (
    <>
      <JsonLd
        data={[
          createWebSiteSchema(),
          createOrganizationSchema(),
          createWebPageSchema({
            name: "Strength & Yoga for Complex Bodies",
            path: "/",
            description:
              "Science-backed strength and yoga coaching for adults with chronic illness, autoimmune conditions, and complex bodies.",
          }),
        ]}
      />
      <HomePage />
    </>
  );
}
