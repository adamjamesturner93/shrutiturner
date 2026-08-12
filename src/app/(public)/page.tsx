import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { HomePage } from "@/views/home";
import { buildSeoMetadata } from "@/lib/content/metadata";
import {
  createOrganizationSchema,
  createWebPageSchema,
  createWebSiteSchema,
} from "@/lib/seo/structured-data";
import { getExistingPlatformUrl, isHoldingStage } from "@/lib/site-stage";
import { HoldingPage } from "@/views/holding-page";
import { getFeaturedTestimonials } from "@/lib/content";

// Temporary social-sharing image until a dedicated 1200 × 630 asset is supplied.
const HOME_SOCIAL_IMAGE_PLACEHOLDER = "https://shrutiturner.co.uk/images/shruti-deadlift.jpeg";

export async function generateMetadata(): Promise<Metadata> {
  if (isHoldingStage()) {
    return buildSeoMetadata({
      title: "Something new is coming",
      description:
        "A new home for evidence-based coaching and resources is launching in early summer 2026.",
      canonicalUrl: "https://shrutiturner.co.uk",
    });
  }

  return buildSeoMetadata({
    title: "Personal Training & Movement Coaching | Shruti Turner",
    absoluteTitle: true,
    description:
      "Personal training and movement coaching that brings together rehabilitation, fitness and wellbeing. Flexible support built around your body, goals and real life.",
    canonicalUrl: "https://shrutiturner.co.uk/",
    openGraphTitle: "Movement that works with your body, not against it | Shruti Turner",
    openGraphDescription:
      "Personal training and movement coaching bringing together rehabilitation, fitness and wellbeing, built around your body, your goals and your real life.",
    image: HOME_SOCIAL_IMAGE_PLACEHOLDER,
    imageAlt: "Shruti Turner strength training",
    keywords: [
      "personal training",
      "movement coaching",
      "strength training",
      "rehabilitation",
      "fitness",
      "wellbeing",
      "personalised training",
    ],
  });
}

export default async function Page() {
  if (isHoldingStage()) {
    return (
      <>
        <JsonLd
          data={createWebPageSchema({
            name: "Shruti Turner",
            path: "/",
            description:
              "A new home for evidence-based coaching and resources is launching in early summer 2026.",
          })}
        />
        <HoldingPage existingPlatformUrl={getExistingPlatformUrl()} />
      </>
    );
  }

  const homepageTestimonials = await getFeaturedTestimonials();

  return (
    <>
      <JsonLd
        data={[
          createWebSiteSchema(),
          createOrganizationSchema(),
          createWebPageSchema({
            name: "Personal Training & Movement Coaching",
            path: "/",
            description:
              "Personal training and movement coaching that brings together rehabilitation, fitness and wellbeing. Flexible support built around your body, goals and real life.",
          }),
        ]}
      />
      <HomePage testimonials={homepageTestimonials} />
    </>
  );
}
