import type { Metadata } from "next";
import { HomePage } from "@/views/home";
import { buildPageMetadata, buildSeoMetadata } from "@/lib/content/metadata";
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
    return <HoldingPage existingPlatformUrl={getExistingPlatformUrl()} />;
  }

  return <HomePage />;
}
